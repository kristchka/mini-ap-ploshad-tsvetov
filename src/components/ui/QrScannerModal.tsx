import React from "react";
import QrScanner from "qr-scanner";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ScanState = "idle" | "starting" | "success" | "error";
type CameraMode = "environment" | "user";

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

export function QrScannerModal({
  open,
  onClose,
}: Props): React.ReactElement | null {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const scannerRef = React.useRef<QrScanner | null>(null);

  const [scanState, setScanState] = React.useState<ScanState>("idle");
  const [message, setMessage] = React.useState("");

  const [cameraMode, setCameraMode] = React.useState<CameraMode>("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = React.useState(false);
  const [switchingCamera, setSwitchingCamera] = React.useState(false);

  const stopScanner = React.useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {
      // Scanner may already be stopped.
    }

    scanner.destroy();
    scannerRef.current = null;
  }, []);

  const goToTarget = React.useCallback(
    async (raw: string) => {
      const target = buildTargetFromScan(raw);

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
      } catch {
        // Vibration can fail on unsupported devices.
      }

      await stopScanner();

      window.setTimeout(() => {
        window.location.assign(target);
      }, 700);
    },
    [stopScanner]
  );

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
            await goToTarget(text);
          },
          {
            preferredCamera: cameraMode,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current = scanner;
        await scanner.start();

        if (cancelled) {
          await stopScanner();
          return;
        }

        try {
          const cameras = await QrScanner.listCameras(true);
          setHasMultipleCameras(cameras.length > 1);
        } catch {
          setHasMultipleCameras(false);
        }

        setScanState("idle");
        setMessage("Наведите камеру на QR-код павильона.");
      } catch (e: unknown) {
        setScanState("error");
        setMessage(e instanceof Error ? e.message : "Не удалось запустить камеру.");
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open, goToTarget, stopScanner, cameraMode]);

  React.useEffect(() => {
    if (!open) {
      setScanState("idle");
      setMessage("");
      setSwitchingCamera(false);
    }
  }, [open]);

  async function handlePickFromGallery(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanState("starting");
    setMessage("Читаем QR-код из изображения...");

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      const text = typeof result === "string" ? result : result.data;
      await goToTarget(text);
    } catch {
      setScanState("error");
      setMessage("Не удалось распознать QR-код на изображении.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleSwitchCamera() {
    const scanner = scannerRef.current;
    if (!scanner) return;

    const nextCamera: CameraMode =
      cameraMode === "environment" ? "user" : "environment";

    setSwitchingCamera(true);
    setScanState("starting");
    setMessage(
      nextCamera === "user"
        ? "Переключаем на фронтальную камеру..."
        : "Переключаем на основную камеру..."
    );

    try {
      await scanner.setCamera(nextCamera);
      setCameraMode(nextCamera);
      setScanState("idle");
      setMessage("Наведите камеру на QR-код павильона.");
    } catch (e: unknown) {
      setScanState("error");
      setMessage(
        e instanceof Error ? e.message : "Не удалось переключить камеру. Попробуйте ещё раз."
      );
    } finally {
      setSwitchingCamera(false);
    }
  }

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
                textAlign: "center",
                padding: 20,
              }}
            >
              {message || "Запускаем камеру..."}
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

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handlePickFromGallery}
          style={{ display: "none" }}
        />

        {hasMultipleCameras && (
          <button
            type="button"
            onClick={handleSwitchCamera}
            disabled={switchingCamera}
            style={{
              marginTop: 14,
              width: "100%",
              height: 54,
              borderRadius: 18,
              border: "1px solid #e7dcd0",
              background: "rgba(255,253,250,.95)",
              color: "var(--green-dark)",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              opacity: switchingCamera ? 0.7 : 1,
            }}
          >
            {cameraMode === "environment"
              ? "Переключить на фронтальную камеру"
              : "Переключить на основную камеру"}
          </button>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            marginTop: 10,
            width: "100%",
            height: 54,
            borderRadius: 18,
            border: "1px solid #e7dcd0",
            background: "rgba(255,253,250,.95)",
            color: "var(--green-dark)",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Загрузить QR из фото
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 10,
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
