export interface DiffChunk {
  filePath: string;
  fileStatus: "added" | "modified" | "deleted" | "renamed";
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  startLine: number; // line number in the new file
  lines: DiffLine[];
}

export interface DiffLine {
  type: "added" | "removed" | "context";
  content: string;
  lineNumber: number | null; // line number in new file (null for removed lines)
  diffPosition: number; // position in the diff (for GitHub API)
}

/**
 * Parses a unified diff string into structured chunks per file.
 * Tracks diff positions for GitHub inline comment API.
 */
export function parseDiff(rawDiff: string): DiffChunk[] {
  const chunks: DiffChunk[] = [];
  const fileBlocks = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const block of fileBlocks) {
    const lines = block.split("\n");
    const firstLine = lines[0];

    // Extract file paths
    const aMatch = firstLine.match(/a\/(.+?) b\//);
    const bMatch = firstLine.match(/b\/(.+)$/);
    if (!aMatch || !bMatch) continue;

    const oldPath = aMatch[1];
    const newPath = bMatch[1];

    let fileStatus: DiffChunk["fileStatus"] = "modified";
    if (block.includes("\nnew file mode")) fileStatus = "added";
    else if (block.includes("\ndeleted file mode")) fileStatus = "deleted";
    else if (oldPath !== newPath) fileStatus = "renamed";

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let diffPosition = 0;
    let newLineNumber = 0;

    for (const line of lines) {
      // Hunk header: @@ -old_start,old_count +new_start,new_count @@
      const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        diffPosition++; // hunk header counts as a position
        newLineNumber = parseInt(hunkMatch[1], 10);
        currentHunk = {
          header: line,
          startLine: newLineNumber,
          lines: [],
        };
        hunks.push(currentHunk);
        continue;
      }

      if (!currentHunk) continue;

      if (line.startsWith("+") && !line.startsWith("+++")) {
        diffPosition++;
        currentHunk.lines.push({
          type: "added",
          content: line.slice(1),
          lineNumber: newLineNumber++,
          diffPosition,
        });
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        diffPosition++;
        currentHunk.lines.push({
          type: "removed",
          content: line.slice(1),
          lineNumber: null,
          diffPosition,
        });
      } else if (line.startsWith(" ")) {
        diffPosition++;
        currentHunk.lines.push({
          type: "context",
          content: line.slice(1),
          lineNumber: newLineNumber++,
          diffPosition,
        });
      }
    }

    if (hunks.length > 0) {
      chunks.push({ filePath: newPath, fileStatus, hunks });
    }
  }

  return chunks;
}

/**
 * Formats diff chunks into a compact string for GPT-4 consumption.
 * Limits total size to avoid token limits.
 */
export function formatDiffForAI(
  chunks: DiffChunk[],
  maxChars = 12000
): string {
  let result = "";

  for (const chunk of chunks) {
    if (chunk.fileStatus === "deleted") continue; // Skip deleted files

    const fileHeader = `\n### File: ${chunk.filePath} (${chunk.fileStatus})\n`;
    let fileContent = fileHeader;

    for (const hunk of chunk.hunks) {
      fileContent += `\n${hunk.header}\n`;
      for (const line of hunk.lines) {
        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        const lineNum = line.lineNumber ? `L${line.lineNumber}` : "    ";
        fileContent += `${lineNum} ${prefix} ${line.content}\n`;
      }
    }

    if (result.length + fileContent.length > maxChars) break;
    result += fileContent;
  }

  return result;
}
