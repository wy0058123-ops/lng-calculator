const usdPriceInput = document.querySelector("#usd-price");
const heatValueInput = document.querySelector("#mmbtu-per-ton");
const exchangeRateInput = document.querySelector("#exchange-rate");
const taxRateInput = document.querySelector("#tax-rate");
const rateHint = document.querySelector("#rate-hint");
const resultNumber = document.querySelector("#result-number");
const formulaMain = document.querySelector("#formula-main");
const formulaDetail = document.querySelector("#formula-detail");

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

  const valuesAreValid =
    Number.isFinite(usdPrice) &&
    Number.isFinite(heatValue) &&
    Number.isFinite(exchangeRate) &&
    Number.isFinite(taxRate) &&
    usdPrice >= 0 &&
    heatValue > 0 &&
    exchangeRate > 0 &&
    taxRate >= 0;

  if (!valuesAreValid) {
    resultNumber.textContent = "—";
    formulaMain.textContent = "请填写美元价格，汇率加载后自动计算";
    formulaDetail.textContent =
      "美元价格 × 人民币汇率 × 每吨百万英热 ×（1＋税率）= 含税人民币元/吨";
    return;
  }

  const untaxedRmbPerTon = usdPrice * exchangeRate * heatValue;
  const rmbPerTon = untaxedRmbPerTon * (1 + taxRate / 100);

  resultNumber.textContent = formatNumber(rmbPerTon);
  formulaMain.textContent = `${formatNumber(
    usdPrice,
  )} 美元/MMBtu × ${formatNumber(
    exchangeRate,
    4,
  )} 元/美元 × ${formatNumber(
    heatValue,
  )} MMBtu/吨 ×（1＋${formatNumber(taxRate)}%）= ${formatNumber(
    rmbPerTon,
  )} 元/吨`;
  formulaDetail.textContent = `未税价 ${formatNumber(
    untaxedRmbPerTon,
  )} 元/吨 ＋ 税额 ${formatNumber(
    rmbPerTon - untaxedRmbPerTon,
  )} 元/吨 = 含税价 ${formatNumber(rmbPerTon)} 元/吨`;
}

[usdPriceInput, heatValueInput, exchangeRateInput, taxRateInput].forEach((input) => {
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
