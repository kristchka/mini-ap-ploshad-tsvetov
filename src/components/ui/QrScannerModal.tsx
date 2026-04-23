import React from "react";
import QrScanner from "qr-scanner";

type Props = {
  open: boolean;
  onClose: () => void;
};

function buildTargetFromScan(raw: string): string | null {
  const value = raw.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (/^[a-z0-9-_]+$/i.test(value)) {
    const url = new URL(window.location.href);
    url.searchParams.set("qr", value);
    return url.toString();
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось запустить камеру.";
}

export function QrScannerModal({
  open,
  onClose,
}: Props): React.ReactElement | null {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const scannerRef = React.useRef<QrScanner | null>(null);
  const [error, setError] = React.useState("");
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    if (!open || !videoRef.current) return;

    let cancelled = false;

    async function startScanner() {
      setStarting(true);
      setError("");

      try {
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          throw new Error("Камера на устройстве не найдена.");
        }

        const scanner = new QrScanner(
          videoRef.current!,
          (result) => {
            const text = typeof result === "string" ? result : result.data;
            const target = buildTargetFromScan(text);

            scanner.stop();
            scanner.destroy();
            scannerRef.current = null;

            if (!target) {
              setError("QR-код прочитан, но формат не распознан.");
              return;
            }

            window.location.assign(target);
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current = scanner;
        await scanner.start();

        if (cancelled) {
          scanner.stop();
          scanner.destroy();
          scannerRef.current = null;
        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop();
        scanner.destroy();
        scannerRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fffdfa",
          borderRadius: 24,
          padding: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--green-dark)" }}>
            Сканировать QR
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть сканер QR"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            background: "#000",
            aspectRatio: "3 / 4",
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            muted
            playsInline
          />
        </div>

        <p
          style={{
            fontSize: 14,
            color: "var(--muted)",
            marginTop: 12,
            lineHeight: 1.5,
          }}
        >
          Наведи камеру на QR-код павильона. После распознавания переход
          выполнится автоматически.
        </p>

        {starting && (
          <div
            style={{
              marginTop: 10,
              fontSize: 14,
              color: "var(--green)",
              fontWeight: 600,
            }}
          >
            Запускаем камеру...
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 10,
              background: "rgba(217,79,79,.08)",
              color: "#b13f3f",
              borderRadius: 14,
              padding: 12,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 14,
            width: "100%",
            height: 52,
            borderRadius: 16,
            border: "1px solid #e7dcd0",
            background: "#fff",
            color: "var(--text)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
