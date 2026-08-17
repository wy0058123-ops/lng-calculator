const usdPriceInput = document.querySelector("#usd-price");
const heatValueInput = document.querySelector("#mmbtu-per-ton");
const exchangeRateInput = document.querySelector("#exchange-rate");
const taxRateInput = document.querySelector("#tax-rate");
const otherCostInput = document.querySelector("#other-cost");
const rateHint = document.querySelector("#rate-hint");
const resultNumber = document.querySelector("#result-number");

const RATE_API_URL = "https://api.frankfurter.dev/v2/rate/USD/CNY";
let applyingAutomaticRate = false;

const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

function updateCalculation() {
  const usdPrice = Number.parseFloat(usdPriceInput.value);
  const heatValue = Number.parseFloat(heatValueInput.value);
  const exchangeRate = Number.parseFloat(exchangeRateInput.value);
  const taxRate = Number.parseFloat(taxRateInput.value);
  const otherCost = Number.parseFloat(otherCostInput.value);

  const valuesAreValid =
    Number.isFinite(usdPrice) &&
    Number.isFinite(heatValue) &&
    Number.isFinite(exchangeRate) &&
    Number.isFinite(taxRate) &&
    Number.isFinite(otherCost) &&
    usdPrice >= 0 &&
    heatValue > 0 &&
    exchangeRate > 0 &&
    taxRate >= 0 &&
    otherCost >= 0;

  if (!valuesAreValid) {
    resultNumber.textContent = "—";
    return;
  }

  const untaxedRmbPerTon = usdPrice * exchangeRate * heatValue;
  const rmbPerTon = untaxedRmbPerTon * (1 + taxRate / 100) + otherCost;

  resultNumber.textContent = formatNumber(rmbPerTon);
}

[usdPriceInput, heatValueInput, exchangeRateInput, taxRateInput, otherCostInput].forEach((input) => {
  input.addEventListener("input", updateCalculation);
  input.addEventListener("change", updateCalculation);
});

exchangeRateInput.addEventListener("input", () => {
  if (!applyingAutomaticRate) {
    rateHint.textContent = "汇率已手动修改";
  }
});

async function loadDailyExchangeRate() {
  rateHint.textContent = "正在获取每日美元汇率…";

  try {
    const response = await fetch(RATE_API_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Exchange-rate request failed");

    const data = await response.json();
    if (!Number.isFinite(data.rate) || data.rate <= 0) {
      throw new Error("Invalid exchange rate");
    }

    applyingAutomaticRate = true;
    exchangeRateInput.value = Number(data.rate).toFixed(4);
    applyingAutomaticRate = false;
    rateHint.textContent = `每日参考汇率 · 数据日期 ${data.date}`;
    updateCalculation();
  } catch {
    rateHint.textContent = "自动获取失败，请手动填写汇率";
  }
}

updateCalculation();
loadDailyExchangeRate();
