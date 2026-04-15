import React from "react";
import type { PavilionCode } from "../types";
import { PAVILIONS } from "../config";
import { ProgressBar } from "./ui";

interface PavilionGridProps {
  visited: PavilionCode[];
  current?: PavilionCode | null;
  total: number;
}

export function PavilionGrid({
  visited,
  current,
  total,
}: PavilionGridProps): React.ReactElement {
  return (
    <div>
      <ProgressBar current={visited.length} total={total} />
      <div className="pav-grid">
        {PAVILIONS.map((p) => {
          const done = visited.includes(p.code);
          const isNew = p.code === current;
          return (
            <div
              key={p.code}
              className={`pav${isNew ? " now" : done ? " done" : ""}`}
            >
              <span className="pav-icon">{done || isNew ? "✿" : "·"}</span>
              <span>{p.code.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PavilionListProps {
  visited: PavilionCode[];
}

export function PavilionList({ visited }: PavilionListProps): React.ReactElement {
      return (
    <div>
      <p className="pav-list-title">Все павильоны</p>
      {PAVILIONS.map((p) => {
        const counted = visited.includes(p.code);
        return (
          <div key={p.code} className={`pav-li${counted ? " done" : ""}`}>
            <span style={{ fontSize: 17 }}>{counted ? "✿" : "·"}</span>
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: counted ? 700 : 400,
                color: counted ? "var(--green)" : "var(--muted)",
              }}
            >
              {p.name}
            </span>
            {counted && (
              <span
                style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}
              >
                Засчитан
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}