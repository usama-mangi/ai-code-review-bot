/**
 * Lightweight static analysis scanner for common security vulnerabilities.
 * Runs before the AI review to provide additional context.
 */

export interface SecurityFinding {
  pattern: string;
  severity: "bug" | "security";
  file: string;
  line: number;
  description: string;
}

interface SecurityRule {
  id: string;
  regex: RegExp;
  description: string;
  severity: "bug" | "security";
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: "hardcoded-secret",
    regex: /(api_?key|secret|password|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    description: "Potential hardcoded secret or credential detected",
    severity: "security",
  },
  {
    id: "sql-injection-concat",
    regex: /(['"`]\s*\+\s*|`\$\{.*\}\s*)/,
    description: "Potential SQL injection via string concatenation in query",
    severity: "security",
  },
  {
    id: "eval-usage",
    regex: /\beval\s*\(/,
    description: "Use of eval() — potential code injection risk",
    severity: "security",
  },
  {
    id: "innerHTML",
    regex: /\.innerHTML\s*=/,
    description: "Setting innerHTML directly — potential XSS vulnerability",
    severity: "security",
  },
  {
    id: "dangerouslySetInnerHTML",
    regex: /dangerouslySetInnerHTML/,
    description: "React dangerouslySetInnerHTML used — potential XSS risk",
    severity: "security",
  },
  {
    id: "md5-usage",
    regex: /\bmd5\s*\(/i,
    description: "MD5 is cryptographically broken — use SHA-256 or better",
    severity: "security",
  },
  {
    id: "console-log",
    regex: /console\.(log|warn|error|debug)\s*\(/,
    description: "Console statement left in production code",
    severity: "bug",
  },
  {
    id: "unsafe-json-parse",
    regex: /JSON\.parse\s*\(\s*(?!.*try)/,
    description: "Unsafe JSON.parse without try-catch — may crash on malformed input",
    severity: "bug",
  },
];

/**
 * Scans a diff for known security vulnerabilities using regex patterns.
 * Returns findings that can be passed to the AI as additional context.
 */
export function scanForSecurityIssues(
  diffContent: string,
  filePath: string,
  lineOffset: number
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = diffContent.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Only scan added lines
    if (!line.startsWith("+") || line.startsWith("+++")) continue;

    for (const rule of SECURITY_RULES) {
      if (rule.regex.test(line)) {
        findings.push({
          pattern: rule.id,
          severity: rule.severity,
          file: filePath,
          line: lineOffset + i,
          description: rule.description,
        });
      }
    }
  }

  return findings;
}

/**
 * Formats security findings into a brief text block prepended to the AI prompt.
 */
export function formatSecurityFindings(findings: SecurityFinding[]): string {
  if (findings.length === 0) return "";

  const lines = findings.map(
    (f) => `- [${f.severity.toUpperCase()}] ${f.file}:${f.line} — ${f.description}`
  );

  return `⚠️ Static analysis flagged:\n${lines.join("\n")}\n\n`;
}