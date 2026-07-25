import { getEntityPriceData } from "../currency/CurrencyContext.jsx";

export const REWARD_BLOCK_POINTS = 1000;
export const REWARD_BLOCK_COP = 50000;
export const COP_PER_REWARD_POINT = 1000;

const wholePoints = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
};

export const getProductRewardPoints = (entity) => {
  const copPrice = getEntityPriceData(entity, "COP");
  return {
    points: wholePoints(copPrice.price / COP_PER_REWARD_POINT),
    maxPoints: wholePoints(copPrice.max / COP_PER_REWARD_POINT),
    isRange:
      Boolean(copPrice.isRange) &&
      wholePoints(copPrice.max) > wholePoints(copPrice.price),
  };
};

export const getCartItemRewardPoints = (item) => {
  const quantity = Math.max(0, Number(item?.quantity) || 0);
  return wholePoints(
    (getEntityPriceData(item, "COP").price * quantity) / COP_PER_REWARD_POINT,
  );
};

export const getCartRewardPoints = (items = []) => {
  const copTotal = items.reduce((sum, item) => {
    const quantity = Math.max(0, Number(item?.quantity) || 0);
    const price = Number(getEntityPriceData(item, "COP").price);
    return sum + (Number.isFinite(price) ? price * quantity : 0);
  }, 0);
  return wholePoints(copTotal / COP_PER_REWARD_POINT);
};

export const formatRewardPoints = (points, locale = "es-CO") =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    wholePoints(points),
  );
