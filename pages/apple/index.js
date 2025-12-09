import { useState, useEffect } from "react";

export default function ApplePayPage() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [logs, setLogs] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Verificar suporte do navegador para Payment Request API
    const checkSupport = () => {
      if (typeof window !== "undefined" && window.PaymentRequest) {
        // Verificar se Apple Pay está disponível
        const request = new PaymentRequest(
          [{ supportedMethods: "https://apple.com/apple-pay" }],
          {
            total: {
              label: "Teste",
              amount: { currency: "BRL", value: "0.01" },
            },
          },
        );

        request
          .canMakePayment()
          .then((result) => {
            setIsSupported(!!result);
            addLog("info", `Apple Pay suportado: ${!!result}`);
          })
          .catch((error) => {
            setIsSupported(false);
            addLog("error", `Erro ao verificar suporte: ${error.message}`);
          });
      } else {
        setIsSupported(false);
        addLog("error", "Payment Request API não suportada neste navegador");
      }
    };

    checkSupport();
  }, []);

  const addLog = (type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    const logEntry = {
      timestamp,
      type,
      message,
      data,
    };
    setLogs((prev) => [...prev, logEntry]);
  };

  // const formatCurrency = (value, currencyCode) => {
  //   return new Intl.NumberFormat("pt-BR", {
  //     style: "currency",
  //     currency: currencyCode,
  //   }).format(value);
  // };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      addLog("error", "Por favor, insira um valor válido");
      return;
    }

    if (!isSupported) {
      addLog("error", "Apple Pay não está disponível");
      return;
    }

    setIsProcessing(true);
    addLog("info", "Iniciando pagamento com Apple Pay...");

    try {
      const paymentDetails = {
        total: {
          label: "Pagamento Teste",
          amount: {
            currency: currency,
            value: parseFloat(amount).toFixed(2),
          },
        },
        displayItems: [
          {
            label: "Valor",
            amount: {
              currency: currency,
              value: parseFloat(amount).toFixed(2),
            },
          },
        ],
      };

      const paymentMethodData = {
        supportedMethods: "https://apple.com/apple-pay",
        data: {
          version: 3,
          merchantIdentifier: "merchant.com.example", // Placeholder - não é necessário para POC
          countryCode: currency === "BRL" ? "BR" : "US",
          currencyCode: currency,
          supportedNetworks: ["visa", "masterCard", "amex", "discover"],
          merchantCapabilities: ["supports3DS"],
        },
      };

      const paymentRequest = new PaymentRequest(
        [paymentMethodData],
        paymentDetails,
      );

      addLog("info", "PaymentRequest criado", {
        paymentDetails,
        paymentMethodData,
      });

      // Tratar mudança de método de pagamento
      paymentRequest.addEventListener("paymentmethodchange", (event) => {
        addLog("info", "Método de pagamento alterado", event);
      });

      // Mostrar interface do Apple Pay
      const paymentResponse = await paymentRequest.show();

      addLog("success", "Pagamento autorizado pelo usuário");

      // Capturar dados do pagamento
      const paymentData = paymentResponse.details;

      // Extrair informações específicas
      const extractedData = {
        paymentData: {
          data: paymentData.data,
          header: {
            ephemeralPublicKey: paymentData.header?.ephemeralPublicKey,
          },
        },
        complete: paymentData.complete,
        methodName: paymentData.methodName,
        payerEmail: paymentData.payerEmail,
        payerName: paymentData.payerName,
        payerPhone: paymentData.payerPhone,
        shippingAddress: paymentData.shippingAddress,
        shippingOption: paymentData.shippingOption,
      };

      addLog("success", "Dados do pagamento capturados", extractedData);

      // Mostrar dados específicos solicitados
      addLog("info", "=== DADOS ESPECÍFICOS SOLICITADOS ===");
      if (paymentData.data) {
        addLog("success", "paymentData.data", paymentData.data);
      } else {
        addLog("warning", "paymentData.data não encontrado");
      }

      if (paymentData.header?.ephemeralPublicKey) {
        addLog(
          "success",
          "paymentData.header.ephemeralPublicKey",
          paymentData.header.ephemeralPublicKey,
        );
      } else {
        addLog(
          "warning",
          "paymentData.header.ephemeralPublicKey não encontrado",
        );
      }

      // Completar o pagamento (simular processamento)
      await paymentResponse.complete("success");

      addLog("success", "Pagamento processado com sucesso");
    } catch (error) {
      if (error.name === "AbortError") {
        addLog("warning", "Pagamento cancelado pelo usuário");
      } else {
        addLog("error", `Erro no pagamento: ${error.message}`, error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // const getLogColor = (type) => {
  //   switch (type) {
  //     case "success":
  //       return "text-green-600";
  //     case "error":
  //       return "text-red-600";
  //     case "warning":
  //       return "text-yellow-600";
  //     case "info":
  //     default:
  //       return "text-blue-600";
  //   }
  // };

  const formatLogData = (data) => {
    if (!data) return "";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1
        style={{ marginBottom: "2rem", fontSize: "2rem", fontWeight: "bold" }}
      >
        Apple Pay POC
      </h1>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="amount"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Valor do Pagamento
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
            disabled={isProcessing}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="currency"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Moeda
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: "white",
            }}
            disabled={isProcessing}
          >
            <option value="BRL">BRL (Real Brasileiro)</option>
            <option value="USD">USD (Dólar Americano)</option>
          </select>
        </div>

        <button
          onClick={handlePayment}
          disabled={!isSupported || isProcessing || !amount}
          style={{
            width: "100%",
            padding: "1rem",
            backgroundColor:
              isSupported && amount && !isProcessing ? "#000" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor:
              isSupported && amount && !isProcessing
                ? "pointer"
                : "not-allowed",
            opacity: isSupported && amount && !isProcessing ? 1 : 0.6,
          }}
        >
          {isProcessing
            ? "Processando..."
            : isSupported
              ? "Pagar com Apple Pay"
              : "Apple Pay não disponível"}
        </button>

        {!isSupported && (
          <p
            style={{
              marginTop: "1rem",
              color: "#d32f2f",
              fontSize: "0.875rem",
            }}
          >
            Apple Pay não está disponível neste navegador/dispositivo.
            Certifique-se de estar usando Safari no macOS/iOS ou um navegador
            compatível.
          </p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          padding: "1.5rem",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "0.875rem",
          maxHeight: "600px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>
            Logs
          </h2>
          <button
            onClick={clearLogs}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Limpar Logs
          </button>
        </div>

        {logs.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic" }}>
            Nenhum log ainda. Faça um pagamento para ver os dados retornados.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {logs.map((log, index) => (
              <div
                key={index}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#252526",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${
                    log.type === "success"
                      ? "#4caf50"
                      : log.type === "error"
                        ? "#f44336"
                        : log.type === "warning"
                          ? "#ff9800"
                          : "#2196f3"
                  }`,
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <span style={{ color: "#888" }}>[{log.timestamp}]</span>{" "}
                  <span
                    style={{
                      color:
                        log.type === "success"
                          ? "#4caf50"
                          : log.type === "error"
                            ? "#f44336"
                            : log.type === "warning"
                              ? "#ff9800"
                              : "#2196f3",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                    }}
                  >
                    {log.type}
                  </span>
                  <span style={{ marginLeft: "0.5rem" }}>{log.message}</span>
                </div>
                {log.data && (
                  <pre
                    style={{
                      margin: 0,
                      padding: "0.75rem",
                      backgroundColor: "#1e1e1e",
                      borderRadius: "4px",
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {formatLogData(log.data)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
