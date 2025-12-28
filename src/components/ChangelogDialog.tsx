import { X, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";

interface ChangelogDialogProps {
  onClose: () => void;
}

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    added: string[];
    changed: string[];
    fixed: string[];
  };
}

export default function ChangelogDialog({ onClose }: ChangelogDialogProps) {
  const { t } = useTranslation();
  const [changelog, setChangelog] = useState("");
  const [parsedEntries, setParsedEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    electronAPI.getChangelog().then((result) => {
      if (result.success && result.content) {
        setChangelog(result.content);
        parseChangelog(result.content);
      }
      setLoading(false);
    });
  }, []);

  const parseChangelog = (content: string) => {
    const entries: ChangelogEntry[] = [];
    const versionRegex = /## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/g;
    let match;

    while ((match = versionRegex.exec(content)) !== null) {
      const version = match[1];
      const date = match[2];

      const startIndex = match.index + match[0].length;
      const nextVersionMatch = versionRegex.exec(content);
      const endIndex = nextVersionMatch ? nextVersionMatch.index : content.length;

      const sectionContent = content.substring(startIndex, endIndex);

      const added: string[] = [];
      const changed: string[] = [];
      const fixed: string[] = [];

      const addedMatch = sectionContent.match(/### Added\n([\s\S]*?)(?=### |## )/);
      if (addedMatch) {
        added.push(...addedMatch[1].split("\n").filter((line) => line.trim().startsWith("-")).map((line) => line.trim().substring(2).trim()));
      }

      const changedMatch = sectionContent.match(/### Changed\n([\s\S]*?)(?=### |## )/);
      if (changedMatch) {
        changed.push(...changedMatch[1].split("\n").filter((line) => line.trim().startsWith("-")).map((line) => line.trim().substring(2).trim()));
      }

      const fixedMatch = sectionContent.match(/### Fixed\n([\s\S]*?)(?=### |## )/);
      if (fixedMatch) {
        fixed.push(...fixedMatch[1].split("\n").filter((line) => line.trim().startsWith("-")).map((line) => line.trim().substring(2).trim()));
      }

      entries.push({ version, date, changes: { added, changed, fixed } });
    }

    setParsedEntries(entries);
    if (entries.length > 0) {
      setExpandedVersions(new Set([entries[0].version]));
    }
  };

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    borderRadius: "12px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    width: "500px",
    maxWidth: "90vw",
    maxHeight: "80vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--surface-light)",
  };

  const titleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--on-surface)",
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    color: "var(--on-surface-variant)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const contentStyle: React.CSSProperties = {
    padding: "16px",
    overflowY: "auto",
    flex: 1,
  };

  const versionItemStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-light)",
    borderRadius: "8px",
    marginBottom: "8px",
    overflow: "hidden",
  };

  const versionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    cursor: "pointer",
    userSelect: "none",
  };

  const versionTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--on-surface)",
  };

  const versionDateStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--on-surface-variant)",
    fontWeight: 400,
  };

  const expandIconStyle: React.CSSProperties = {
    transition: "transform 0.2s ease",
    transform: "rotate(0deg)",
  };

  const expandedContentStyle: React.CSSProperties = {
    padding: "0 16px 12px",
  };

  const changeSectionStyle: React.CSSProperties = {
    marginBottom: "8px",
  };

  const changeTitleStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--on-surface-variant)",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const changeItemStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--on-surface)",
    paddingLeft: "12px",
    marginBottom: "2px",
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: "center",
    color: "var(--on-surface-variant)",
    padding: "40px",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            <FileText size={18} />
            {t("about.changelog")}
          </h2>
          <button style={closeButtonStyle} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {loading ? (
            <div style={emptyStyle}>Loading...</div>
          ) : parsedEntries.length === 0 ? (
            <div style={emptyStyle}>No changelog available</div>
          ) : (
            parsedEntries.map((entry) => (
              <div key={entry.version} style={versionItemStyle}>
                <div
                  style={versionHeaderStyle}
                  onClick={() => toggleVersion(entry.version)}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={versionTitleStyle}>v{entry.version}</span>
                    <span style={versionDateStyle}>{entry.date}</span>
                  </div>
                  <div
                    style={{
                      ...expandIconStyle,
                      transform: expandedVersions.has(entry.version)
                        ? "rotate(90deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>

                {expandedVersions.has(entry.version) && (
                  <div style={expandedContentStyle}>
                    {entry.changes.added.length > 0 && (
                      <div style={changeSectionStyle}>
                        <div style={changeTitleStyle}>Added</div>
                        {entry.changes.added.map((item, i) => (
                          <div key={i} style={changeItemStyle}>• {item}</div>
                        ))}
                      </div>
                    )}
                    {entry.changes.changed.length > 0 && (
                      <div style={changeSectionStyle}>
                        <div style={changeTitleStyle}>Changed</div>
                        {entry.changes.changed.map((item, i) => (
                          <div key={i} style={changeItemStyle}>• {item}</div>
                        ))}
                      </div>
                    )}
                    {entry.changes.fixed.length > 0 && (
                      <div style={changeSectionStyle}>
                        <div style={changeTitleStyle}>Fixed</div>
                        {entry.changes.fixed.map((item, i) => (
                          <div key={i} style={changeItemStyle}>• {item}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
