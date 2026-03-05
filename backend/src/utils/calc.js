export function sum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}

export function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}