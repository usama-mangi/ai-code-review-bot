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
 * Formats diff chunks into a compact string for AI consumption.
 * Skips deleted files and non-reviewable files.
 * Limits total size to avoid token limits.
 */
export function formatDiffForAI(
  chunks: DiffChunk[],
  maxChars = 8000
): string {
  let result = "";

  for (const chunk of chunks) {
    if (chunk.fileStatus === "deleted") continue;
    if (isNonReviewableFile(chunk.filePath)) continue;

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

/**
 * Filters out files that don't need AI review.
 * Skips: lock files, generated files, binary files, minified bundles,
 * config files, test fixtures, and vendored dependencies.
 */
function isNonReviewableFile(filePath: string): boolean {
  const skipPatterns = [
    /\.lock$/i,
    /package-lock\.json$/i,
    /yarn\.lock$/i,
    /bun\.lock$/i,
    /pnpm-lock\.yaml$/i,
    /\.min\.(js|css)$/i,
    /\.bundle\.(js|css)$/i,
    /\.map$/i,
    /\.d\.ts$/i,
    /\.generated\./i,
    /\.pb\.(go|ts|js)$/i,
    /\.pb\.cc$/i,
    /\.proto$/i,
    /\.graphql$/i,
    /\.gql$/i,
    /\.sum$/i,
    /\.mod$/i,
    /go\.sum$/i,
    /Cargo\.lock$/i,
    /Gemfile\.lock$/i,
    /poetry\.lock$/i,
    /\.pyc$/i,
    /\.class$/i,
    /\.o$/i,
    /\.so$/i,
    /\.dylib$/i,
    /\.dll$/i,
    /\.exe$/i,
    /\.bin$/i,
    /\.zip$/i,
    /\.tar(\.\w+)?$/i,
    /\.gz$/i,
    /\.bz2$/i,
    /\.7z$/i,
    /\.rar$/i,
    /\.pdf$/i,
    /\.jpg$/i,
    /\.jpeg$/i,
    /\.png$/i,
    /\.gif$/i,
    /\.svg$/i,
    /\.ico$/i,
    /\.woff2?$/i,
    /\.ttf$/i,
    /\.eot$/i,
    /\.mp4$/i,
    /\.mp3$/i,
    /\.wav$/i,
    /\.webm$/i,
    /\.mov$/i,
    /\.csv$/i,
    /\.tsv$/i,
    /\.xlsx?$/i,
    /\.docx?$/i,
    /\.pptx?$/i,
    /\/vendor\//i,
    /\/node_modules\//i,
    /\/\.git\//i,
    /\/dist\//i,
    /\/build\//i,
    /\/out\//i,
    /\/target\//i,
    /\/__pycache__\//i,
    /\/\.next\//i,
    /\/\.nuxt\//i,
    /\/\.cache\//i,
    /\/coverage\//i,
    /\/migrations\//i,
    /\/fixtures\//i,
    /\/snapshots\//i,
    /\/\.vscode\//i,
    /\/\.idea\//i,
  ];

  return skipPatterns.some((pattern) => pattern.test(filePath));
}
