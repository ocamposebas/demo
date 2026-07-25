import { getEntityPriceData } from "../currency/CurrencyContext.jsx";

export const REWARD_BLOCK_POINTS = 1000;
export const REWARD_BLOCK_COP = 50000;

const wholePoints = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
};

export const getProductRewardPoints = (entity) => {
  const copPrice = getEntityPriceData(entity, "COP");
  return {
    points: wholePoints(copPrice.price),
    maxPoints: wholePoints(copPrice.max),
    isRange:
      Boolean(copPrice.isRange) &&
      wholePoints(copPrice.max) > wholePoints(copPrice.price),
  };
};

export const getCartItemRewardPoints = (item) => {
  const quantity = Math.max(0, Number(item?.quantity) || 0);
  return wholePoints(getEntityPriceData(item, "COP").price * quantity);
};

export const formatRewardPoints = (points, locale = "es-CO") =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    wholePoints(points),
  );
