import { Address, beginCell, Cell } from '@ton/core';

const DEBUG_TON = true;

// USDT Jetton Master Address on TON Mainnet
export const USDT_MASTER_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

// Format USDT amount (6 decimals)
export function formatUSDTAmount(amount: number): bigint {
  // Округляем до 2 знаков после запятой чтобы избежать дробных чисел
  const rounded = Math.floor(amount * 100) / 100;
  return BigInt(Math.floor(rounded * 1_000_000));
}

// Parse USDT amount from bigint to number
export function parseUSDTAmount(amount: bigint): number {
  return Number(amount) / 1_000_000;
}

// Create jetton transfer payload
export function createJettonTransferPayload(
  toAddress: string,
  amount: bigint,
  comment?: string,
  responseToAddress?: string
): string {
  const destinationAddress = Address.parse(toAddress);
  const responseAddress = Address.parse(responseToAddress ?? toAddress);

  console.log('[USDT PAYLOAD] Creating payload with:');
  console.log('  - Destination:', toAddress);
  console.log('  - Amount (raw):', amount.toString());
  console.log('  - Amount (USDT):', Number(amount) / 1_000_000);
  console.log('  - Comment:', comment || 'none');
  console.log('  - Response to:', responseToAddress || toAddress);

  // Build the transfer message according to TEP-74 standard
  const transferMessage = beginCell()
    .storeUint(0xf8a7ea5, 32) // op::transfer
    .storeUint(0, 64) // query_id
    .storeCoins(amount) // amount in smallest units (6 decimals for USDT)
    .storeAddress(destinationAddress) // destination
    .storeAddress(responseAddress) // response_destination
    .storeBit(0) // custom_payload
    .storeCoins(BigInt('50000000')); // forward_ton_amount (0.05 TON для надежности)

  // Forward payload with comment
  if (comment && comment.length > 0) {
    const forwardPayload = beginCell()
      .storeUint(0, 32) // text comment
      .storeStringTail(comment)
      .endCell();

    transferMessage.storeBit(1);
    transferMessage.storeRef(forwardPayload);
  } else {
    transferMessage.storeBit(0);
  }

  const payload = transferMessage.endCell().toBoc().toString('base64');
  console.log('[USDT PAYLOAD] Generated payload (base64):', payload);
  
  return payload;
}

// Helper function to get user's USDT jetton wallet address
export async function getUserUSDTJettonWallet(ownerAddress: string): Promise<string> {
  console.log('[USDT WALLET] Starting to resolve USDT wallet for:', ownerAddress);

  const tonapiJsonHeaders: Record<string, string> = {
    'content-type': 'application/json'
  };
  const tonapiGetHeaders: Record<string, string> = {};
  
  // Normalize address
  const owner = Address.parse(ownerAddress);
  const ownerBounce = owner.toString({ urlSafe: true, bounceable: true });
  const ownerNonBounce = owner.toString({ urlSafe: true, bounceable: false });
  const ownerFriendly = owner.toString({ urlSafe: false, bounceable: true });
  const ownerRaw = owner.toRawString();

  const jettonAddr = Address.parse(USDT_MASTER_ADDRESS);
  const jettonRaw = jettonAddr.toRawString();

  // Method 1: get_wallet_address on jetton master
  const tryRunGetMethod = async (): Promise<string | null> => {
    try {
      const url = `https://tonapi.io/v2/blockchain/accounts/${jettonRaw}/methods/get_wallet_address`;
      const ownerParams = [ownerRaw, ownerBounce, ownerNonBounce, ownerFriendly];

      for (const val of ownerParams) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: tonapiJsonHeaders,
            body: JSON.stringify({ args: [{ type: 'slice', value: val }] })
          });

          if (!res.ok) continue;

          const data = await res.json();
          const addr = data?.decoded?.jetton_wallet_address as string | undefined;
          if (addr) return addr;
        } catch (e) {
          if (DEBUG_TON) console.debug('[TONAPI] runGetMethod exception', String(e));
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  // Method 2: account jettons
  const tryAccountJetton = async (addrRaw: string) => {
    const url = `https://tonapi.io/v2/accounts/${addrRaw}/jettons`;
    const res = await fetch(url, { headers: tonapiGetHeaders });

    if (res.ok) {
      const data = await res.json();
      const items = data?.balances || data?.jettons || data?.items || [];

      for (const it of items) {
        const jAddr = it?.jetton?.address || it?.jetton_address || it?.jetton?.jetton_address;
        const walletAddr = it?.wallet_address?.address || it?.wallet?.address;

        if (jAddr && walletAddr) {
          try {
            if (Address.parse(String(jAddr)).toRawString() === jettonRaw) {
              return String(walletAddr);
            }
          } catch {}
        }
      }
    }

    return null;
  };

  let candidates = [];
  
  // Try get_wallet_address first
  const methodResult = await tryRunGetMethod();
  if (methodResult) {
    console.log('[USDT WALLET] Found via get_wallet_address:', methodResult);
    candidates.push(methodResult);
  }
  
  // Try account jettons
  if (!candidates.length) {
    const jettonResults = await Promise.all([
      tryAccountJetton(ownerRaw),
      tryAccountJetton(ownerBounce),
      tryAccountJetton(ownerNonBounce),
    ]);
    candidates = [...candidates, ...jettonResults];
  }

  const found = candidates.find(Boolean);
  if (found) {
    try {
      const addrFriendly = Address.parse(String(found)).toString({ urlSafe: false, bounceable: true });
      console.log('[USDT WALLET] Resolved wallet:', addrFriendly);
      return addrFriendly;
    } catch {
      return found as string;
    }
  }

  // Fallback: deterministic derivation
  console.log('[USDT WALLET] Using fallback derivation...');
  try {
    const jettonWalletCode = 'te6ccgECFAEAAwQAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHUBgcCAUgICQC7CDHAJJfBOAB0NMDAXGwlRNfA/AL4PpA+kAx+gAxcdch+gAx+gAwc6m0APACBLOOFDBsIjRSMscF8uGVAfpA1DAQI/AD4AbTH9M/ghBfzD0UUjC64wIwNDQ1NYIABADAAA3ABLAHIygfL/8nQ+QIDAQHPAI4bAgIDxwAKCwIDzsAMDQAXyMv/UAP6AkBYgBAABPIAAA8ADlAjgBAABPIAAgEgDg8CASAQEQANQISTHwHiAR4g1wsfghAPin6lUiC6AhESABcyMv/UAP6AkBYzMsAA/8jLPwH6AkBYzxYBzxYBPMntVA==';
    const codeCell = Cell.fromBase64(jettonWalletCode);
    const owner = Address.parse(ownerAddress);
    const master = Address.parse(USDT_MASTER_ADDRESS);

    const dataCell = beginCell()
      .storeCoins(0)
      .storeAddress(owner)
      .storeAddress(master)
      .storeRef(codeCell)
      .endCell();

    const stateInit = beginCell()
      .storeBit(0)
      .storeBit(0)
      .storeBit(1)
      .storeRef(codeCell)
      .storeBit(1)
      .storeRef(dataCell)
      .storeBit(0)
      .endCell();

    const derived = new Address(0, stateInit.hash()).toString({ urlSafe: false, bounceable: true });
    console.log('[USDT WALLET] Fallback derived wallet:', derived);
    return derived;
  } catch (e) {
    console.error('[USDT WALLET] Fallback derive failed:', String(e));
  }

  throw new Error('Unable to resolve USDT jetton wallet address');
}

