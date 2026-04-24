import React from "react";
import QrScanner from "qr-scanner";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ScanState = "idle" | "starting" | "success" | "error";

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

  const [scanState, setScanState] = React.useState<ScanState>("idle");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!open || !videoRef.current) return;

    let cancelled = false;

    async function startScanner() {
      setScanState("starting");
      setMessage("Запускаем камеру...");

      try {
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          throw new Error("Камера на устройстве не найдена.");
        }

        const scanner = new QrScanner(
          videoRef.current!,
          async (result) => {
            const text = typeof result === "string" ? result : result.data;
            const target = buildTargetFromScan(text);

            if (!target) {
              setScanState("error");
              setMessage("QR-код прочитан, но формат не распознан.");
              return;
            }

            setScanState("success");
            setMessage("QR-код распознан. Переходим...");

            try {
              if (navigator.vibrate) {
                navigator.vibrate(80);
              }
            } catch {}

            try {
              await scanner.stop();
            } catch {}

            scanner.destroy();
            scannerRef.current = null;

            window.setTimeout(() => {
              window.location.assign(target);
            }, 700);
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
          try {
            await scanner.stop();
          } catch {}
          scanner.destroy();
          scannerRef.current = null;
          return;
        }

        setScanState("idle");
        setMessage("Наведите камеру на QR-код павильона.");
      } catch (error) {
        setScanState("error");
        setMessage(getErrorMessage(error));
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          scanner.stop();
        } catch {}
        scanner.destroy();
        scannerRef.current = null;
      }
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setScanState("idle");
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  const isStarting = scanState === "starting";
  const isSuccess = scanState === "success";
  const isError = scanState === "error";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.58)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#fffdfa",
          borderRadius: 28,
          padding: 16,
          boxShadow: "0 24px 70px rgba(0,0,0,.24)",
          position: "relative",
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
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--green-dark)",
                lineHeight: 1.1,
              }}
            >
              Сканируйте QR
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginTop: 4,
              }}
            >
              Наведите камеру на код павильона
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              border: "1px solid #e7dcd0",
              background: "#fff",
              fontSize: 26,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            position: "relative",
            borderRadius: 22,
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

          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "68%",
                aspectRatio: "1 / 1",
                borderRadius: 28,
                border: isSuccess
                  ? "3px solid #2f6b3b"
                  : isError
                    ? "3px solid #b13f3f"
                    : "3px solid rgba(242, 138, 30, 0.9)",
                boxShadow: isSuccess
                  ? "0 0 0 9999px rgba(0,0,0,.18)"
                  : "0 0 0 9999px rgba(0,0,0,.14)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 28,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)",
                }}
              />
            </div>
          </div>

          {isStarting && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,.26)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Запускаем камеру...
            </div>
          )}

          {isSuccess && (
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 16,
                background: "rgba(47,107,59,.95)",
                color: "#fff",
                borderRadius: 16,
                padding: "12px 14px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              QR-код распознан
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 16,
            background: isError
              ? "rgba(217,79,79,.08)"
              : isSuccess
                ? "rgba(47,107,59,.08)"
                : "rgba(47,107,59,.05)",
            color: isError
              ? "#b13f3f"
              : isSuccess
                ? "var(--green)"
                : "var(--muted)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {message || "Наведите камеру на QR-код павильона."}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 14,
            width: "100%",
            height: 54,
            borderRadius: 18,
            border: "1px solid #e7dcd0",
            background: "#fff",
            color: "var(--text)",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
