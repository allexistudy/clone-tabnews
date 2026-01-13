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
          merchantIdentifier: "merchant.onlineips.lubyapplepay",
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
      console.log("paymentResponse", paymentResponse);

      addLog("success", "Pagamento autorizado pelo usuário");

      // Capturar dados do pagamento
      const rawDetails = paymentResponse.details ?? {};

      // Detectar ambiente (sandbox vs produção)
      const isSandbox =
        window.location.hostname.includes("localhost") ||
        window.location.hostname.includes("127.0.0.1") ||
        window.location.hostname.includes("test") ||
        window.location.hostname.includes("sandbox");

      addLog(
        "info",
        `Ambiente detectado: ${isSandbox ? "SANDBOX (Teste)" : "PRODUÇÃO"}`,
      );

      // Log completo para debug
      addLog("info", "Raw paymentResponse.details completo", {
        ...rawDetails,
        environment: isSandbox ? "sandbox" : "production",
      });

      // Apple Pay retorna o token em paymentData (string JSON)
      // O formato típico é: { paymentData: "string JSON com token" }
      let paymentDataString = null;
      let paymentDataParsed = null;

      // Tentar diferentes caminhos onde o token pode estar
      if (rawDetails.paymentData) {
        paymentDataString = rawDetails.paymentData;
      } else if (rawDetails.token) {
        paymentDataString = rawDetails.token;
      } else if (typeof rawDetails === "string") {
        paymentDataString = rawDetails;
      }

      // Se paymentData é uma string, tentar fazer parse
      if (typeof paymentDataString === "string") {
        try {
          paymentDataParsed = JSON.parse(paymentDataString);
          addLog("info", "paymentData parseado com sucesso");
        } catch (e) {
          addLog("warning", "paymentData não é um JSON válido", {
            error: e.message,
            rawString: paymentDataString.substring(0, 100) + "...",
          });
        }
      } else if (paymentDataString && typeof paymentDataString === "object") {
        paymentDataParsed = paymentDataString;
      }

      // Extrair dados específicos
      // O formato do Apple Pay token geralmente é:
      // { header: { ephemeralPublicKey: "...", ... }, data: "..." }
      const tokenData = paymentDataParsed || paymentDataString || rawDetails;

      const header = tokenData?.header || null;
      const data = tokenData?.data || paymentDataString || null;
      const ephemeralPublicKey = header?.ephemeralPublicKey || null;

      // Extrair informações específicas solicitadas
      const extractedData = {
        environment: isSandbox ? "sandbox" : "production",
        paymentData: {
          data: data,
          header: {
            ephemeralPublicKey: ephemeralPublicKey,
            transactionId: header?.transactionId,
            publicKeyHash: header?.publicKeyHash,
            applicationData: header?.applicationData,
          },
        },
        rawDetails: rawDetails,
        parsedToken: paymentDataParsed,
        rawPaymentDataString:
          typeof paymentDataString === "string"
            ? paymentDataString.substring(0, 200) +
              (paymentDataString.length > 200 ? "..." : "")
            : null,
        note: isSandbox
          ? "Este é um pagamento de teste em ambiente sandbox. Os dados são reais do Apple Pay, mas não há cobrança real."
          : "Este é um pagamento em ambiente de produção.",
      };

      addLog("success", "Dados do pagamento capturados", extractedData);

      // Mostrar dados específicos solicitados
      addLog("info", "=== DADOS ESPECÍFICOS SOLICITADOS ===");

      if (data) {
        addLog("success", "paymentData.data encontrado", {
          type: typeof data,
          length: typeof data === "string" ? data.length : "N/A",
          preview:
            typeof data === "string"
              ? data.substring(0, 100) + (data.length > 100 ? "..." : "")
              : data,
        });
      } else {
        addLog("warning", "paymentData.data não encontrado");
      }

      if (ephemeralPublicKey) {
        addLog(
          "success",
          "paymentData.header.ephemeralPublicKey encontrado",
          ephemeralPublicKey,
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
      console.log("error", error);
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

  const handleNewApplePay = () => {
    if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) {
      console.log("Apple Pay indisponível");
    }

    const request = {
      countryCode: "BR",
      currencyCode: "BRL",
      supportedNetworks: ["visa", "masterCard"],
      merchantCapabilities: ["supports3DS"],
      total: {
        label: "Teste Apple Pay",
        amount: "0.01",
      },
    };

    const session = new window.ApplePaySession(3, request);

    // 🔐 obrigatório
    session.onvalidatemerchant = async (event) => {
      const res = await fetch("/api/validate-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validationURL: event.validationURL,
        }),
      });
      console.log("res", res);

      const merchantSession = await res.json();
      session.completeMerchantValidation(merchantSession);
    };

    // ✅ AQUI CHEGA O TOKEN
    session.onpaymentauthorized = (event) => {
      const token = event.payment.token;
      console.log("token", JSON.stringify(token, null, 2));

      console.log(
        "paymentData.data:",
        JSON.stringify(token.paymentData, null, 2),
      );
      console.log(
        "ephemeralPublicKey:",
        token.paymentData.header.ephemeralPublicKey,
      );

      session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
    };

    session.begin();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div>
        <button onClick={handleNewApplePay}>apple pay</button>
      </div>

      <h1
        style={{ marginBottom: "2rem", fontSize: "2rem", fontWeight: "bold" }}
      >
        Apple Pay POC
      </h1>

      <div
        style={{
          backgroundColor: "#fff3cd",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          borderLeft: "4px solid #ffc107",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "1rem",
            fontSize: "1.25rem",
            fontWeight: "600",
          }}
        >
          🧪 Como Configurar Ambiente Sandbox (Teste Real):
        </h2>
        <p style={{ marginTop: 0, marginBottom: "1rem" }}>
          Para simular pagamentos reais e obter a resposta exata do Apple Pay
          (sem dados fake):
        </p>
        <ol style={{ margin: 0, paddingLeft: "1.5rem", lineHeight: "1.8" }}>
          <li>
            <strong>Criar conta de testador no App Store Connect:</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li>
                Acesse{" "}
                <a
                  href="https://appstoreconnect.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1976d2", textDecoration: "underline" }}
                >
                  App Store Connect
                </a>
              </li>
              <li>Menu: Usuários e Acesso → Sandbox → Testadores</li>
              <li>Clique em &quot;+&quot; para adicionar nova conta</li>
              <li>
                No dispositivo de teste: saia do iCloud e faça login com a conta
                de testador
              </li>
            </ul>
          </li>
          <li>
            <strong>Adicionar cartão de teste no Wallet:</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li>Abra o app Wallet no dispositivo</li>
              <li>
                Toque em &quot;+&quot; → &quot;Cartão de Crédito ou Débito&quot;
              </li>
              <li>
                Use cartões de teste da Apple (exemplos):
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                  <li>
                    <strong>Visa:</strong> 4532 1234 5678 9010 (qualquer data
                    futura, qualquer CVV)
                  </li>
                  <li>
                    <strong>Mastercard:</strong> 5555 5555 5555 4444
                  </li>
                  <li>
                    <strong>Amex:</strong> 3782 822463 10005
                  </li>
                </ul>
              </li>
            </ul>
          </li>
          <li>
            <strong>Configurar Merchant ID no Apple Developer:</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li>
                Acesse{" "}
                <a
                  href="https://developer.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1976d2", textDecoration: "underline" }}
                >
                  Apple Developer
                </a>
              </li>
              <li>Certificates, Identifiers & Profiles → Identifiers</li>
              <li>
                Configure o Merchant ID:{" "}
                <code
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "2px 6px",
                    borderRadius: "3px",
                  }}
                >
                  merchant.onlineips.lubyapplepay
                </code>
              </li>
              <li>Associe o domínio ao Merchant ID</li>
            </ul>
          </li>
        </ol>
        <p
          style={{
            marginTop: "1rem",
            marginBottom: 0,
            fontSize: "0.875rem",
            color: "#856404",
            fontStyle: "italic",
          }}
        >
          <strong>Importante:</strong> O ambiente sandbox retorna respostas
          reais do Apple Pay (incluindo paymentData.data e ephemeralPublicKey),
          mas não processa pagamentos reais. É o ambiente ideal para
          desenvolvimento e testes.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#e3f2fd",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          borderLeft: "4px solid #2196f3",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "1rem",
            fontSize: "1.25rem",
            fontWeight: "600",
          }}
        >
          Requisitos Técnicos:
        </h2>
        <ul style={{ margin: 0, paddingLeft: "1.5rem", lineHeight: "1.8" }}>
          <li>
            <strong>HTTPS:</strong> O site deve estar rodando em HTTPS (já
            configurado)
          </li>
          <li>
            <strong>Merchant ID:</strong> Deve estar configurado no Apple
            Developer e associado ao domínio
          </li>
          <li>
            <strong>Navegador:</strong> Safari no macOS/iOS (ou navegadores
            compatíveis com Payment Request API)
          </li>
          <li>
            <strong>Dispositivo:</strong> Apple Pay configurado no dispositivo
            com cartão válido (ou cartão de teste em sandbox)
          </li>
          <li>
            <strong>Domínio:</strong> O domínio deve estar associado ao Merchant
            ID no Apple Developer
          </li>
        </ul>
        <p
          style={{
            marginTop: "1rem",
            marginBottom: 0,
            fontSize: "0.875rem",
            color: "#666",
          }}
        >
          <strong>Nota:</strong> Se o pagamento ficar travado em
          &quot;Processando...&quot;, verifique se o Merchant ID está
          corretamente configurado e se o domínio está associado no Apple
          Developer Portal.
        </p>
      </div>

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
