'use strict';

// Pure JavaScript replacement for @aws-amplify/react-native.
// Used via Metro module alias so Expo Go never loads the native module.
// computeModPow and computeS are implemented with BigInt arithmetic.

// Cognito's hardcoded 2048-bit SRP prime (same as RFC 5054)
const INIT_N =
  'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
  '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
  'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
  'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
  'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' +
  'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' +
  '83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
  '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
  'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' +
  'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' +
  '15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64' +
  'ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7' +
  'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B' +
  'F12FFA06D98A0864D87602733EC86A64521F2B18177B200C' +
  'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31' +
  '43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF';

// Square-and-multiply modular exponentiation
function modPow(base, exp, mod) {
  if (mod === BigInt(1)) return BigInt(0);
  let result = BigInt(1);
  base = base % mod;
  while (exp > BigInt(0)) {
    if (exp & BigInt(1)) result = (result * base) % mod;
    exp = exp >> BigInt(1);
    base = (base * base) % mod;
  }
  return result;
}

// (base ^ exponent) mod divisor  — all hex strings in, hex string out
const computeModPow = ({ base, exponent, divisor }) =>
  Promise.resolve().then(() => {
    const b = BigInt('0x' + base);
    const e = BigInt('0x' + exponent);
    const m = BigInt('0x' + divisor);
    return modPow(b, e, m).toString(16);
  });

// SRP S = (B - k*g^x)^(a + u*x) mod N
// N is Cognito's hardcoded prime; all params are hex strings, returns hex string
const computeS = ({ a, g, k, x, b, u }) =>
  Promise.resolve().then(() => {
    const N = BigInt('0x' + INIT_N);
    const bigA = BigInt('0x' + a);
    const bigG = BigInt('0x' + g);
    const bigK = BigInt('0x' + k);
    const bigX = BigInt('0x' + x);
    const bigB = BigInt('0x' + b);
    const bigU = BigInt('0x' + u);

    const gx   = modPow(bigG, bigX, N);
    const kgx  = (bigK * gx) % N;
    const diff = ((bigB - kgx) % N + N) % N; // keep positive
    const exp  = bigA + bigU * bigX;
    return modPow(diff, exp, N).toString(16);
  });

// Device info stubs (not critical for auth)
const getOperatingSystem = () => Promise.resolve({ name: 'Unknown', version: 'Unknown' });
const getDeviceName      = () => Promise.resolve('Unknown Device');
const getIsNativeError   = () => false;

// Module loaders — forward to real packages (both available in Expo Go)
const loadAsyncStorage        = () => require('@react-native-async-storage/async-storage').default;
const loadNetInfo             = () => require('@react-native-community/netinfo').default;
const loadBuffer              = () => require('buffer').Buffer;
const loadAppState            = () => require('react-native').AppState;
const loadUrlPolyfill         = () => {};
const loadGetRandomValues     = () => require('react-native-get-random-values');
const loadBase64              = () => {
  const Buf = require('buffer').Buffer;
  return {
    // binary string → base64
    encode: (str) => Buf.from(str, 'binary').toString('base64'),
    // base64 → binary string
    decode: (b64) => Buf.from(b64, 'base64').toString('binary'),
  };
};
const loadAmplifyRtnPasskeys  = () => null;
const loadAmplifyPushNotification = () => null;
const loadAmplifyWebBrowser   = () => null;

module.exports = {
  computeModPow,
  computeS,
  getOperatingSystem,
  getDeviceName,
  getIsNativeError,
  loadAmplifyRtnPasskeys,
  loadAmplifyPushNotification,
  loadAmplifyWebBrowser,
  loadAsyncStorage,
  loadNetInfo,
  loadBuffer,
  loadUrlPolyfill,
  loadGetRandomValues,
  loadBase64,
  loadAppState,
};
