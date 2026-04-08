---
title: "AES-256 All Modes Explained: From ECB to GCM | AES-256 各模式詳解：從 ECB 到 GCM"
date: 2026-04-08 23:01:00 +0800
categories: [Security, Technology]
tags: [aes, encryption, gcm, symmetric, security, assisted_by_ai]
toc: true
---

In our previous article, we introduced symmetric encryption and gave AES a brief mention. But AES isn't just a single algorithm — it has multiple **modes of operation**, each with different security properties and use cases.

Today, we'll systematically explore all major AES modes, understand why ECB is dangerous, how CBC solves its problems, why CTR turns block ciphers into stream ciphers, and finally dive deep into **GCM** — the gold standard for authenticated encryption.

---

## Quick Recap: What is AES?

```
┌─────────────────────────────────────────────────────────────┐
│                      AES Basics                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   AES = Advanced Encryption Standard                         │
│   • Block cipher: processes data in fixed 128-bit blocks   │
│   • Key sizes: 128, 192, or 256 bits                        │
│   • Today we focus on AES-256 (256-bit key)                │
│                                                             │
│   ┌─────────────────────────────────────────────┐         │
│   │  Input: 128-bit plaintext                   │         │
│   │       ↓                                     │         │
│   │  14 rounds of transformation                │         │
│   │       ↓                                     │         │
│   │  Output: 128-bit ciphertext                 │         │
│   └─────────────────────────────────────────────┘         │
│                                                             │
│   Problem: How do we encrypt data LARGER than 128 bits?     │
│   Answer: Modes of operation!                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## All AES Modes Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  AES Modes of Operation                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│   ECB           │   CBC           │   CTR                  │
│   (Electronic   │   (Cipher      │   (Counter)            │
│   Codebook)     │   Block        │                        │
│                 │   Chaining)    │                        │
├─────────────────┼─────────────────┼─────────────────────────┤
│  ❌ Insecure    │  ✅ Secure      │  ✅ Secure             │
│  (Pattern       │  (Needs IV)    │  (Stream cipher)       │
│   leakage)      │                 │                        │
├─────────────────┼─────────────────┼─────────────────────────┤
│   OFB           │   CFB           │   GCM                  │
│   (Output       │   (Cipher      │   (Galois/             │
│   Feedback)     │   Feedback)    │   Counter Mode)       │
│                 │                 │                        │
├─────────────────┼─────────────────┼─────────────────────────┤
│  ✅ Secure      │  ✅ Secure      │  ✅ Secure +           │
│  (Stream        │  (Stream)      │  ✅ Authentication     │
│   cipher)       │                 │  (AEAD)               │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Mode 1: ECB (Electronic Codebook) — The Danger Zone

### How ECB Works

```
┌─────────────────────────────────────────────────────────────┐
│                      ECB Mode                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Plaintext (divided into 128-bit blocks):                  │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│   │  P1    │  │  P2    │  │  P3    │  │  P4    │         │
│   └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘         │
│        │           │           │           │               │
│        ↓           ↓           ↓           ↓               │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│   │ Encrypt │  │ Encrypt │  │ Encrypt │  │ Encrypt │         │
│   │ (same   │  │ (same   │  │ (same   │  │ (same   │         │
│   │  key!)  │  │  key!)  │  │  key!)  │  │  key!)  │         │
│   └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘         │
│        │           │           │           │               │
│        ↓           ↓           ↓           ↓               │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│   │  C1    │  │  C2    │  │  C3    │  │  C4    │         │
│   └────────┘  └────────┘  └────────┘  └────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The Critical Flaw: Pattern Leakage

ECB's problem is simple: **identical plaintext blocks produce identical ciphertext blocks**.

```
┌─────────────────────────────────────────────────────────────┐
│         ECB Pattern Leakage (Why It's Dangerous)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Original Image (with patterns):                            │
│   ┌─────────────────────────────────────────────┐          │
│   │  ████████████████████████████████████████  │          │
│   │  ████████████████████████████████████████  │          │
│   │  ████████          ████████████████        │          │
│   │  ████████          ████████████████        │          │
│   │  ████████████████████████████████████████  │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   After ECB Encryption:                                     │
│   ┌─────────────────────────────────────────────┐          │
│   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   └─────────────────────────────────────────────┘          │
│              ↑ Patterns still visible! ↑                    │
│                                                             │
│   This is why ECB should NEVER be used for real data!       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### When ECB Might Be Acceptable

```
┌─────────────────────────────────────────────────────────────┐
│               ECB: Acceptable Use Cases                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ ONLY for encrypting random unique data (e.g., random   │
│      128-bit keys) where each block is guaranteed to be     │
│      different                                              │
│                                                             │
│   ❌ NEVER for:                                             │
│      • Images, documents, any structured data               │
│      • Messages, emails, documents                          │
│      • Database fields with repeated patterns               │
│      • Anything that might have repeated content            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mode 2: CBC (Cipher Block Chaining) — Chaining Blocks Together

### How CBC Works

```
┌─────────────────────────────────────────────────────────────┐
│                      CBC Mode                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Initialization Vector (IV): Random 128-bit value         │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  IV (generated fresh for each encryption)          │  │
│   └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ↓                                 │
│   Plaintext:              │                                 │
│   ┌────────┐             │                                 │
│   │  P1    │──────────────┼──────┐                         │
│   └────┬───┘              │      │                         │
│        │    XOR            │      │                         │
│        ↓    ┌──────────────┘      │                         │
│   ┌────────┐│                        │                         │
│   │ Encrypt│                        │                         │
│   │  (K)   │                        │                         │
│   └────┬───┘│                        │                         │
│        │    └────────────────────────┘                         │
│        ↓                                 │                         │
│   ┌────────┐        ┌────────┐           │                         │
│   │  C1    │───────▶│  P2    │           │                         │
│   └────────┘        └────┬───┘           │                         │
│        │                │    XOR        │                         │
│        │                ↓    ┌──────────┘      │                         │
│        │           ┌────────┐│                    │                         │
│        │           │ Encrypt│                    │                         │
│        │           │  (K)   │                    │                         │
│        │           └────┬───┘│                    │                         │
│        │                │    └────────────────────┘                         │
│        ↓                ↓                                 │
│   ┌────────┐        ┌────────┐                             │
│   │  C2    │───────▶│  P3    │  ...and so on               │
│   └────────┘        └────────┘                             │
│                                                             │
│   Output: C1, C2, C3, C4... (all chained)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC Encryption Formula

```
┌─────────────────────────────────────────────────────────────┐
│                    CBC Encryption                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   C₁ = Encrypt_K( IV ⊕ P₁ )                                │
│   C₂ = Encrypt_K( C₁ ⊕ P₂ )                                │
│   C₃ = Encrypt_K( C₂ ⊕ P₃ )                                │
│   ...                                                       │
│   Cᵢ = Encrypt_K( Cᵢ₋₁ ⊕ Pᵢ )                             │
│                                                             │
│   Where ⊕ = XOR operation                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC Decryption (The Reverse Process)

```
┌─────────────────────────────────────────────────────────────┐
│                    CBC Decryption                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   P₁ = Decrypt_K( C₁ ) ⊕ IV                                │
│   P₂ = Decrypt_K( C₂ ) ⊕ C₁                                │
│   P₃ = Decrypt_K( C₃ ) ⊕ C₂                                │
│   ...                                                       │
│   Pᵢ = Decrypt_K( Cᵢ ) ⊕ Cᵢ₋₁                            │
│                                                             │
│   Notice: Can decrypt block Cᵢ independently if you have   │
│   Cᵢ₋₁ — this is parallelizable!                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC Properties

```
┌─────────────────────────────────────────────────────────────┐
│                  CBC Properties                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ PROS:                                                  │
│   • No pattern leakage — each block depends on all         │
│     previous blocks                                         │
│   • Well-understood, widely used                           │
│   • Decryption is parallelizable (but encryption isn't)     │
│                                                             │
│   ❌ CONS:                                                  │
│   • Must generate fresh IV for each message                 │
│   • Encryption cannot be parallelized (sequential chain)   │
│   • No built-in authentication (integrity check)           │
│                                                             │
│   ⚠️  IV must be:                                           │
│      • Random (not a counter)                              │
│      • Unpredictable                                        │
│      • Published alongside ciphertext (not secret)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC Padding (PKCS#7)

Since AES works on 128-bit blocks, plaintext that's not a multiple of 128 bits needs padding:

```
┌─────────────────────────────────────────────────────────────┐
│                   PKCS#7 Padding                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   If plaintext is 42 bytes (336 bits), we need 128-42=86   │
│   more bits to make 3 complete blocks:                      │
│                                                             │
│   Block 1 (128 bits): 128 bits of plaintext                │
│   Block 2 (128 bits): 128 bits of plaintext                │
│   Block 3 (128 bits): 42 bytes plaintext + 86 bytes padding│
│                                                             │
│   Padding scheme: Each padding byte = number of padding     │
│   bytes (in hex)                                            │
│                                                             │
│   Example: 86 padding bytes → each byte is 0x56             │
│                                                             │
│   Special case: If plaintext is exact multiple of block    │
│   size, add full block of padding (0x10 repeated 16 times) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mode 3: CTR (Counter) — Turning Block Cipher into Stream Cipher

### The Key Insight

Instead of chaining blocks, CTR uses a **counter** to generate a pseudorandom keystream:

```
┌─────────────────────────────────────────────────────────────┐
│                 CTR Mode: Key Insight                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Traditional Block Cipher:                                 │
│   [Encrypt] → transforms block (one-way process)           │
│                                                             │
│   CTR Turn:                                                 │
│   ┌─────────────────────────────────────────────┐         │
│   │  Counter Block = [Nonce || Counter]         │         │
│   │       │                                      │         │
│   │       ↓                                      │         │
│   │  Encrypt_K( Counter Block ) = Keystream     │         │
│   │       │                                      │         │
│   │       ↓                                      │         │
│   │  Keystream ⊕ Plaintext = Ciphertext         │         │
│   │       │                                      │         │
│   │       ↓                                      │         │
│   │  Same keystream ⊕ Ciphertext = Plaintext    │         │
│   └─────────────────────────────────────────────┘         │
│                                                             │
│   It's like XOR-ing with a one-time pad!                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### How CTR Works

```
┌─────────────────────────────────────────────────────────────┐
│                      CTR Mode                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │
│   │ Nonce   │ + │   CTR   │ = │  Block  │   │  Block  │   │
│   │(unique) │   │ (0,1,2) │   │  Input  │   │  Input  │   │
│   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   │
│        │             │             │             │         │
│        │             │             ↓             ↓         │
│        │             │       ┌──────────┐   ┌──────────┐   │
│        │             │       │ Encrypt  │   │ Encrypt  │   │
│        │             │       │    K     │   │    K     │   │
│        │             │       └────┬─────┘   └────┬─────┘   │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Keystream Blocks                        │  │
│   │         KS₁          KS₂          KS₃         KS₄  │  │
│   └─────────────────────────────────────────────────────┘  │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐   │
│   │   P₁   │ ⊕  │   P₂   │ ⊕  │   P₃   │ ⊕  │   P₄   │   │
│   └────┬───┘    └────┬───┘    └────┬───┘    └────┬───┘   │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐   │
│   │   C₁   │    │   C₂   │    │   C₃   │    │   C₄   │   │
│   └────────┘    └────────┘    └────────┘    └────────┘   │
│                                                             │
│   Encrypted output: C₁, C₂, C₃, C₄...                     │
│   (Note: CTR can also work on individual bytes)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CTR Decryption (Same Operation!)

```
┌─────────────────────────────────────────────────────────────┐
│                  CTR Decryption                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   The beautiful property of CTR:                           │
│   Decryption = Encryption (same operation!)                 │
│                                                             │
│   C₁ = P₁ ⊕ Encrypt_K( Nonce || 0 )                        │
│   P₁ = C₁ ⊕ Encrypt_K( Nonce || 0 )  ← same!              │
│                                                             │
│   This means encryption and decryption use IDENTICAL code! │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CTR Properties

```
┌─────────────────────────────────────────────────────────────┐
│                  CTR Properties                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ PROS:                                                  │
│   • Turns block cipher into stream cipher                   │
│   • Both encryption AND decryption are parallelizable       │
│   • Random access: decrypt any block directly if you know   │
│     its counter value (no need to process previous blocks)  │
│   • No padding needed (can encrypt arbitrary lengths)      │
│   • Simple implementation                                   │
│                                                             │
│   ❌ CONS:                                                  │
│   • Never reuse nonce + counter combination (catastrophic!) │
│   • No built-in authentication                              │
│                                                             │
│   ⚠️  Critical nonce requirements:                         │
│      • Nonce must be unique per session                    │
│      • Counter must never repeat within a session          │
│      • Typical: 64-bit nonce + 64-bit counter              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mode 4: GCM (Galois/Counter Mode) — The Gold Standard

Now we arrive at **GCM** — the mode you'll encounter most in modern secure systems: TLS 1.3, SSH, IPsec, and more.

### What Makes GCM Special?

```
┌─────────────────────────────────────────────────────────────┐
│              GCM = CTR + Authentication                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                    GCM                               │  │
│   │  ┌─────────────────────────────────────────────┐    │  │
│   │  │  CTR Mode (Confidentiality)                 │    │  │
│   │  │  • Encrypts plaintext                       │    │  │
│   │  │  • Produces ciphertext                      │    │  │
│   │  └─────────────────────────────────────────────┘    │  │
│   │                       +                             │  │
│   │  ┌─────────────────────────────────────────────┐    │  │
│   │  │  GHASH (Authentication)                     │    │  │
│   │  │  • Produces authentication tag              │    │  │
│   │  │  • Verifies integrity + authenticity        │    │  │
│   │  └─────────────────────────────────────────────┘    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   Output: [Ciphertext] + [Authentication Tag]              │
│                                                             │
│   This is what AEAD (Authenticated Encryption with          │
│   Associated Data) means!                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### GCM Components Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   GCM Two Components                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Component 1: CTR Encryption (Confidentiality)             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Same CTR mode we just learned!                     │  │
│   │  Counter = [IV (unique)] || [counter]                │  │
│   │  Cᵢ = Pᵢ ⊕ Encrypt_K( Counterᵢ )                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   Component 2: GHASH (Authentication)                       │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  • Polynomial hash over ciphertext blocks            │  │
│   │  • Uses Galois field (GF(2¹²⁸)) arithmetic          │  │
│   │  • Computed using XOR and multiplication             │  │
│   │  • H = Encrypt_K( 0¹²⁸ ) — a special key-derived   │
│   │    value used for all hash operations                │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deep Dive: GHASH

### The Galois Field GF(2¹²⁸)

GHASH uses special arithmetic in GF(2¹²⁸) — a finite field where:

```
┌─────────────────────────────────────────────────────────────┐
│                  Galois Field GF(2¹²⁸)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   • All values are 128-bit numbers                          │
│   • Addition = XOR                                          │
│   • Multiplication = polynomial multiplication modulo       │
│     an irreducible polynomial                               │
│                                                             │
│   The irreducible polynomial for GCM:                      │
│   P(x) = x¹²⁸ + x⁷ + x² + x + 1                            │
│                                                             │
│   Why this matters:                                         │
│   • Makes the field "wrap around" properly                  │
│   • Ensures every non-zero element has a multiplicative     │
│     inverse (crucial for the hash to be reversible for      │
│     verification, but not for an attacker)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### GHASH Formula

```
┌─────────────────────────────────────────────────────────────┐
│                      GHASH Formula                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Given blocks: C₁, C₂, C₃... Cₘ                           │
│   And H = Encrypt_K( 0¹²⁸ )                                 │
│                                                             │
│   GHASH(C₁...Cₘ) =                                          │
│       C₁ · Hᵐ ⊕ C₂ · Hᵐ⁻¹ ⊕ ... ⊕ Cₘ · H¹                │
│                                                             │
│   Where · = GF(2¹²⁸) multiplication                        │
│                                                             │
│   In simpler terms:                                        │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  X₀ = 0                                              │  │
│   │  X₁ = C₁ ⊕ X₀ · H  = C₁ · H                         │  │
│   │  X₂ = C₂ ⊕ X₁ · H  = C₂ ⊕ C₁ · H²                  │  │
│   │  X₃ = C₃ ⊕ X₂ · H  = C₃ ⊕ C₂ · H ⊕ C₁ · H³         │  │
│   │  ...                                                 │  │
│   │  Xₘ = Cₘ ⊕ Xₘ₋₁ · H  ← final hash                  │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Visualizing GHASH

```
┌─────────────────────────────────────────────────────────────┐
│                 GHASH Computation Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Input blocks: C₁, C₂, C₃                                  │
│   Key hash: H                                                │
│                                                             │
│   Step 1:                                                   │
│   ┌─────────┐                                               │
│   │ X₀ = 0  │                                               │
│   └────┬────┘                                               │
│        │                                                     │
│        ↓                                                     │
│   ┌─────────┐    ┌─────────┐                                 │
│   │ X₁ =    │ =  │ C₁     │ ⊕ ( X₀ · H )                   │
│   │ C₁·H¹   │    │ (×H¹)  │                                 │
│   └────┬────┘    └─────────┘                                 │
│        │                                                     │
│        ↓                                                     │
│   ┌─────────┐    ┌─────────┐                                 │
│   │ X₂ =    │ =  │ C₂     │ ⊕ ( X₁ · H )                   │
│   │ C₂·H¹⊕  │    │ (×H¹)  │    ┌─────────┐                 │
│   │ C₁·H²   │    │         │    │ X₁·H    │                 │
│   └────┬────┘    └─────────┘    │ (×H¹)  │                 │
│        │                         └─────────┘                 │
│        ↓                                                     │
│   ┌─────────┐    ┌─────────┐                                 │
│   │ X₃ =    │ =  │ C₃     │ ⊕ ( X₂ · H )                   │
│   │ C₃·H¹⊕  │    │ (×H¹)  │    ┌─────────┐                 │
│   │ C₂·H²⊕  │    │         │    │ X₂·H    │                 │
│   │ C₁·H³   │    │         │    │ (×H¹)  │                 │
│   └────┬────┘    └─────────┘    └─────────┘                 │
│        │                                                     │
│        ↓                                                     │
│   ┌─────────────────────────────────────────────────────┐  │
│   │ GHASH = X₃ = C₃·H¹ ⊕ C₂·H² ⊕ C₁·H³                   │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## GCM Encryption & Authentication Flow

### Complete GCM Process

```
┌─────────────────────────────────────────────────────────────┐
│                   GCM Encryption Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   INPUT: Plaintext P₁...Pₙ, Associated Data A (optional),   │
│          Secret Key K, Initial Vector IV                    │
│                                                             │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│   STEP 1: Compute H = Encrypt_K( 0¹²⁸ )                    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  K ──▶ [ AES Encrypt ] ──▶ H                       │  │
│   │        all-zero input                               │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   STEP 2: Encrypt Counter Blocks (CTR Mode)                │
│                                                             │
│   For each block i:                                        │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Counterᵢ = IV || (i+1) in 32-bit                   │  │
│   │  Cᵢ = Pᵢ ⊕ Encrypt_K( Counterᵢ )                  │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   STEP 3: Compute GHASH over C blocks                       │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  len(A) || len(C) ──▶ prepend to A||C              │  │
│   │  X = GHASH( A || 0ⁿ || C || 0ⁿ || [len(A)||len(C)]│  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   STEP 4: Compute Authentication Tag                        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Tag = ( Encrypt_K( IV || 0³¹ ) ) ⊕ X              │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   OUTPUT: Ciphertext C₁...Cₙ, Tag T                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### GCM Decryption & Verification

```
┌─────────────────────────────────────────────────────────────┐
│                 GCM Decryption & Verification                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   INPUT: Ciphertext C₁...Cₙ, Tag T, IV, Key K,             │
│          Associated Data A (if any)                         │
│                                                             │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│   STEP 1: Compute H = Encrypt_K( 0¹²⁸ )                    │
│                                                             │
│   STEP 2: Recompute GHASH using received C blocks          │
│           and A (must match what was authenticated)          │
│                                                             │
│   STEP 3: Recompute expected Tag:                          │
│           Expected_T = Encrypt_K( IV || 0³¹ ) ⊕ X         │
│                                                             │
│   STEP 4: Compare T == Expected_T                          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  IF tags match:                                    │  │
│   │     → Decrypt C blocks using CTR (same as before) │  │
│   │     → Data is authentic AND confidential          │  │
│   │                                                      │  │
│   │  IF tags DON'T match:                              │  │
│   │     → REJECT immediately                           │  │
│   │     → Don't decrypt (prevents timing attacks!)    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The Critical Property: Hash Subkey H

```
┌─────────────────────────────────────────────────────────────┐
│               Hash Subkey H = Encrypt_K(0¹²⁸)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   H is derived by encrypting a block of all zeros:         │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                      │  │
│   │    Input:  00000000 00000000 00000000 00000000      │  │
│   │           00000000 00000000 00000000 00000000      │  │
│   │                    ↓ (AES-256 encryption)            │  │
│   │    Output: H = random-looking 128-bit value         │  │
│   │                                                      │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   H is used for ALL GHASH operations in a session          │
│   (same H for all blocks being authenticated)              │
│                                                             │
│   Properties:                                               │
│   • If H = 0, GHASH becomes trivial (vulnerable!)         │
│     → GCM spec REQUIRES H ≠ 0                              │
│   • H should be unpredictable                              │
│   • H reveals information about K if used improperly      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Associated Data (AAD) in GCM

### What is AAD?

One powerful feature of GCM is **Associated Data** — data that is authenticated but NOT encrypted:

```
┌─────────────────────────────────────────────────────────────┐
│              GCM with Associated Data (AAD)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Associated Data (A)        Ciphertext (C)          │  │
│   │  ┌───────────────┐          ┌───────────────┐      │  │
│   │  │ Header        │          │ Encrypted      │      │  │
│   │  │ Sequence #    │          │ Payload        │      │  │
│   │  │ Source/Dest    │          │ (visible to    │      │  │
│   │  │ Timestamps    │          │  eavesdropper) │      │  │
│   │  └───────┬───────┘          └───────┬───────┘      │  │
│   │          │                            │               │  │
│   │          └──────────┬─────────────────┘               │  │
│   │                       ↓                                │  │
│   │              ┌───────────────┐                         │  │
│   │              │    GHASH     │                         │  │
│   │              │  (A || C)    │                         │  │
│   │              └───────┬───────┘                         │  │
│   │                      ↓                                │  │
│   │              ┌───────────────┐                         │  │
│   │              │  Tag (T)     │                         │  │
│   │              └───────────────┘                         │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   A is authenticated (tag depends on A) but not encrypted  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Practical AAD Use Cases

```
┌─────────────────────────────────────────────────────────────┐
│                  AAD Use Cases                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. TLS Records:                                           │
│      • AAD = sequence number, protocol version, type        │
│      • C = encrypted payload                                │
│      → Attacker can't reorder/replay records                │
│                                                             │
│   2. SSH Channels:                                          │
│      • AAD = channel ID, session ID                         │
│      • C = encrypted message                                │
│      → Ensures message belongs to correct session           │
│                                                             │
│   3. File Encryption:                                       │
│      • AAD = file header/metadata                           │
│      • C = encrypted file content                           │
│      → Metadata can't be tampered without detection         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## GCM Security Properties

```
┌─────────────────────────────────────────────────────────────┐
│                  GCM Security Properties                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ CONFIDENTIALITY                                        │
│      • CTR mode provides semantic security                 │
│      • Same plaintext → different ciphertext (with new IV) │
│                                                             │
│   ✅ AUTHENTICATION                                          │
│      • GHASH provides integrity + authenticity             │
│      • Tag verification required before decryption         │
│      • Prevents forgeries                                   │
│                                                             │
│   ✅ AEAD (Authenticated Encryption with Associated Data)  │
│      • Encrypts data while authenticating both             │
│        ciphertext AND unencrypted associated data         │
│                                                             │
│   ⚠️  IMPORTANT CONSTRAINTS:                                │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  IV (Nonce):                                         │  │
│   │  • MUST be unique per key                            │  │
│   │  • Recommended: 96 bits (12 bytes)                   │  │
│   │  • NEVER reuse IV with same key!                     │  │
│   │  • Maximum: 2³² invocations with same key (for 96-bit│  │
│   │    IV) before key must be rotated                    │  │
│   │                                                      │  │
│   │  Tag Length:                                          │  │
│   │  • Default: 128 bits (16 bytes)                      │  │
│   │  • Can be truncated but at least 96 bits recommended  │  │
│   │  • Truncation weakens authentication strength         │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## IV Reuse: The Catastrophic Failure

```
┌─────────────────────────────────────────────────────────────┐
│           IV Reuse in GCM: The Forbidden Mistake             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   If the SAME IV is used twice with the same key:          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Message 1: P₁, C₁ = P₁ ⊕ KS                        │  │
│   │  Message 2: P₂, C₂ = P₂ ⊕ KS  (same keystream!)   │  │
│   │                                                      │  │
│   │  Attacker computes:                                  │  │
│   │  C₁ ⊕ C₂ = (P₁ ⊕ KS) ⊕ (P₂ ⊕ KS) = P₁ ⊕ P₂         │  │
│   │                                                      │  │
│   │  Now attacker can:                                   │  │
│   │  • XOR known plaintext against recovered keystream  │  │
│   │  • Decrypt ALL messages encrypted with this IV!     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   Real-world impact:                                        │
│   • 2013: Cisco VPN clients vulnerable (IV collision)     │
│   • 2016: GCM used incorrectly in TLS (WEP-like weakness)  │
│                                                             │
│   Prevention:                                               │
│   • Use random 96-bit IV for each message                   │
│   • Or use deterministic IV derivation (HDR, ratcheting)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Mode Comparison

```
┌─────────────────────────────────────────────────────────────┐
│               AES Modes: Complete Comparison                 │
├──────────┬──────────┬───────────┬──────────┬──────────────┤
│   Mode   │ Parallel │ Built-in  │ Padding  │   Status     │
│          │ Encrypt? │   Auth?   │  Needed? │              │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   ECB    │    ✅    │    ❌     │    ✅   │ ❌ Never use │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CBC    │    ❌    │    ❌     │    ✅   │ ✅ Legacy    │
│          │ (chain)  │           │          │   systems    │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CTR    │    ✅    │    ❌     │    ❌   │ ✅ Streaming │
│          │          │           │          │   (no AAD)  │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   OFB    │    ❌    │    ❌     │    ❌   │ ⚠️ Rarely   │
│          │          │           │          │   used       │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CFB    │    ❌    │    ❌     │    ❌   │ ⚠️ Rarely   │
│          │          │           │          │   used       │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   GCM    │    ✅    │    ✅     │    ❌   │ ✅ RECOMMENDED│
│          │          │  (AEAD)  │          │   Standard   │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CCM    │    ❌    │    ✅     │    ✅   │ ⚠️ Complex   │
│          │          │  (AEAD)  │          │   (not covered)│
└──────────┴──────────┴───────────┴──────────┴──────────────┘
```

### When to Use What

```
┌─────────────────────────────────────────────────────────────┐
│                  Mode Selection Guide                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   📌 GCM (AES-256-GCM):                                    │
│      • TLS 1.3, SSH, IPsec, WireGuard                     │
│      • When you need both encryption + authentication      │
│      • Modern applications (2015+)                          │
│                                                             │
│   📌 CTR (AES-256-CTR):                                    │
│      • When you only need encryption (no auth needed)      │
│      • Combine with separate HMAC if needed                │
│      • Stream-oriented protocols                           │
│                                                             │
│   📌 CBC (AES-256-CBC):                                    │
│      • Legacy systems only                                 │
│      • Combine with HMAC-SHA256 for authentication         │
│      • Legacy TLS (< 1.3)                                  │
│                                                             │
│   📌 ECB:                                                   │
│      • NEVER for real data                                  │
│      • Only for encrypting random independent keys         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Key Takeaways                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. AES is a block cipher — modes make it useful          │
│                                                             │
│   2. ECB: ❌ NEVER use — leaks patterns                    │
│                                                             │
│   3. CBC: ✅ Encrypts well, no auth (legacy)              │
│                                                             │
│   4. CTR: ✅ Fast, parallelizable, stream-like            │
│                                                             │
│   5. GCM: ✅ THE standard for modern encryption             │
│      • CTR for confidentiality                              │
│      • GHASH for authentication                            │
│      • Supports Associated Data (AEAD)                     │
│                                                             │
│   6. Critical: NEVER reuse IV/nonce with same key!        │
│                                                             │
│   7. GCM gives you everything:                              │
│      • Encryption (confidentiality)                        │
│      • Authentication (who sent it?)                        │
│      • Integrity (was it tampered?)                         │
│      • Associated Data (authenticate unencrypted headers)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Understanding these modes helps you make informed decisions about encryption in your applications — and knowing why GCM is the preferred choice in modern protocols like TLS 1.3.

---

- - -

喺上篇文我哋介紹咗對稱加密同埋簡單提到 AES。但係 AES 唔係單一嘅算法——佢有多種**操作模式**，每一種都有唔同嘅安全特性同應用場景。

今日，我哋會系統地探索所有主要嘅 AES 模式，理解點解 ECB 係危險嘅、CBC 點樣解決佢嘅問題、 CTR 點樣將區塊加密變成流加密、然後深入探討 **GCM** —— 認證加密嘅黃金標準。

---

## 快速回顧：咩係 AES？

```
┌─────────────────────────────────────────────────────────────┐
│                      AES 基礎知識                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   AES = Advanced Encryption Standard（進階加密標準）          │
│   • 區塊加密：固定以 128 bits 區塊處理數據                    │
│   • 密鑰大小：128、192 或 256 bits                          │
│   • 今篇集中講 AES-256（256-bit 密鑰）                      │
│                                                             │
│   ┌─────────────────────────────────────────────┐         │
│   │  輸入：128-bit 明文                         │         │
│   │       ↓                                     │         │
│   │  14 輪轉換                                  │         │
│   │       ↓                                     │         │
│   │  輸出：128-bit 密文                         │         │
│   └─────────────────────────────────────────────┘         │
│                                                             │
│   問題：大過 128 bits嘅數據點樣加密？                        │
│   答案：操作模式！                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 所有 AES 模式概覽

```
┌─────────────────────────────────────────────────────────────┐
│                  AES 操作模式                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│   ECB           │   CBC           │   CTR                  │
│   (電子密碼本)   │   (密碼塊鏈)    │   (計數器)             │
│                 │                 │                        │
├─────────────────┼─────────────────┼─────────────────────────┤
│  ❌ 不安全       │  ✅ 安全        │  ✅ 安全               │
│  (模式洩漏)      │  (需要 IV)      │  (流加密)              │
├─────────────────┼─────────────────┼─────────────────────────┤
│   OFB           │   CFB           │   GCM                  │
│   (輸出反饋)     │   (密碼反饋)    │   (Galois/             │
│                 │                 │   Counter Mode)        │
│                 │                 │                        │
├─────────────────┼─────────────────┼─────────────────────────┤
│  ✅ 安全        │  ✅ 安全        │  ✅ 安全 +             │
│  (流加密)       │  (流加密)       │  ✅ 認證               │
│                 │                 │  (AEAD)                │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## 模式 1：ECB（電子密碼本）— 危險地帶

### ECB 點運作

```
┌─────────────────────────────────────────────────────────────┐
│                      ECB 模式                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   明文（分為 128-bit 區塊）：                                │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│   │  P1    │  │  P2    │  │  P3    │  │  P4    │         │
│   └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘         │
│        │           │           │           │               │
│        ↓           ↓           ↓           ↓               │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│   │ 加密    │  │ 加密    │  │ 加密    │  │ 加密    │         │
│   │ (同一   │  │ (同一   │  │ (同一   │  │ (同一   │         │
│   │  密鑰!) │  │  密鑰!) │  │  密鑰!) │  │  密鑰!) │         │
│   └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘         │
│        │           │           │           │               │
│        ↓           ↓           ↓           ↓               │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│   │  C1    │  │  C2    │  │  C3    │  │  C4    │         │
│   └────────┘  └────────┘  └────────┘  └────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 關鍵缺陷：模式洩漏

ECB 的問題好簡單：**相同嘅明文區塊會產生相同嘅密文區塊**。

```
┌─────────────────────────────────────────────────────────────┐
│         ECB 模式洩漏（點解係危險嘅）                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   原始圖片（有圖案）：                                        │
│   ┌─────────────────────────────────────────────┐          │
│   │  ████████████████████████████████████████  │          │
│   │  ████████████████████████████████████████  │          │
│   │  ████████          ████████████████        │          │
│   │  ████████          ████████████████        │          │
│   │  ████████████████████████████████████████  │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   ECB 加密後：                                              │
│   ┌─────────────────────────────────────────────┐          │
│   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │          │
│   └─────────────────────────────────────────────┘          │
│              ↑ 圖案仍然可見！↑                               │
│                                                             │
│   呢個就係點解 ECB 永遠唔應該用於真實數據！                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 幾時可以接受使用 ECB

```
┌─────────────────────────────────────────────────────────────┐
│               ECB：可接受嘅使用場景                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ 只係用於加密隨機唯一嘅數據（例如隨機 128-bit 密鑰）       │
│      （每個區塊都保證唔同）                                  │
│                                                             │
│   ❌ 永遠唔好用於：                                          │
│      • 圖片、文檔、任何結構化數據                             │
│      • 訊息、電郵、文檔                                      │
│      • 有重複模式嘅數據庫欄位                                │
│      • 任何可能有重複內容嘅嘢                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 模式 2：CBC（密碼塊鏈）— 將區塊鏈埋一齊

### CBC 點運作

```
┌─────────────────────────────────────────────────────────────┐
│                      CBC 模式                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   初始向量 (IV)：隨機 128-bit 值                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  IV（每次加密都要重新生成）                            │  │
│   └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ↓                                 │
│   明文：                  │                                 │
│   ┌────────┐             │                                 │
│   │  P1    │──────────────┼──────┐                         │
│   └────┬───┘              │      │                         │
│        │    XOR           │      │                         │
│        ↓    ┌──────────────┘      │                         │
│   ┌────────┐│                       │                         │
│   │  加密  ││                       │                         │
│   │  (K)   ││                       │                         │
│   └────┬───┘│                       │                         │
│        │    └────────────────────────┘                         │
│        ↓                                  │                         │
│   ┌────────┐        ┌────────┐           │                         │
│   │  C1    │───────▶│  P2    │           │                         │
│   └────────┘        └────┬───┘           │                         │
│        │                │    XOR         │                         │
│        │                ↓    ┌──────────┘      │                         │
│        │           ┌────────┐│                    │                         │
│        │           │  加密  ││                    │                         │
│        │           │  (K)   ││                    │                         │
│        │           └────┬───┘│                    │                         │
│        │                │    └────────────────────┘                         │
│        ↓                ↓                                 │
│   ┌────────┐        ┌────────┐                             │
│   │  C2    │───────▶│  P3    │  ...如此類推                │
│   └────────┘        └────────┘                             │
│                                                             │
│   輸出：C1, C2, C3, C4...（全部鏈接）                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC 加密公式

```
┌─────────────────────────────────────────────────────────────┐
│                    CBC 加密                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   C₁ = Encrypt_K( IV ⊕ P₁ )                                │
│   C₂ = Encrypt_K( C₁ ⊕ P₂ )                                │
│   C₃ = Encrypt_K( C₂ ⊕ P₃ )                                │
│   ...                                                       │
│   Cᵢ = Encrypt_K( Cᵢ₋₁ ⊕ Pᵢ )                             │
│                                                             │
│   其中 ⊕ = XOR 運算                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC 解密（反向過程）

```
┌─────────────────────────────────────────────────────────────┐
│                    CBC 解密                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   P₁ = Decrypt_K( C₁ ) ⊕ IV                                │
│   P₂ = Decrypt_K( C₂ ) ⊕ C₁                                │
│   P₃ = Decrypt_K( C₃ ) ⊕ C₂                                │
│   ...                                                       │
│   Pᵢ = Decrypt_K( Cᵢ ) ⊕ Cᵢ₋₁                            │
│                                                             │
│   注意：如果你有 Cᵢ₋₁，可以獨立解密 Cᵢ ——                    │
│   呢個係可以並行化嘅！                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC 特性

```
┌─────────────────────────────────────────────────────────────┐
│                  CBC 特性                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ 優點：                                                 │
│   • 冇模式洩漏 —— 每個區塊依賴所有之前嘅區塊                   │
│   • 廣泛理解，廣泛使用                                       │
│   • 解密可以並行化（但加密唔可以）                           │
│                                                             │
│   ❌ 缺點：                                                 │
│   • 每個訊息必須生成新 IV                                    │
│   • 加密無法並行化（順序鏈）                                 │
│   • 冇內置認證（完整性檢查）                                 │
│                                                             │
│   ⚠️  IV 必須：                                            │
│      • 隨機（唔係計數器）                                    │
│      • 不可預測                                              │
│      • 與密文一起發布（唔係秘密）                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CBC 填充（PKCS#7）

因為 AES 以 128-bit 區塊運作，唔係 128 倍數嘅明文需要填充：

```
┌─────────────────────────────────────────────────────────────┐
│                   PKCS#7 填充                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   如果明文係 42 bytes（336 bits），我哋需要多 86 bits        │
│   黎變成 3 個完整區塊：                                      │
│                                                             │
│   區塊 1 (128 bits)：128 bits 明文                          │
│   區塊 2 (128 bits)：128 bits 明文                          │
│   區塊 3 (128 bits)：42 bytes 明文 + 86 bytes 填充          │
│                                                             │
│   填充方案：每個填充字节 = 填充字節數（十六進制）             │
│                                                             │
│   例子：86 bytes 填充 → 每個字節係 0x56                      │
│                                                             │
│   特殊情況：如果明文正好係區塊大小嘅倍數，                      │
│   添加完整區塊嘅填充（0x10 重複 16 次）                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 模式 3：CTR（計數器）— 將區塊加密變成流加密

### 關鍵洞察

CTR 唔係鏈接區塊，而係用**計數器**來生成偽隨機密鑰流：

```
┌─────────────────────────────────────────────────────────────┐
│                 CTR 模式：關鍵洞察                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   傳統區塊加密：                                             │
│   [加密] → 轉換區塊（單向過程）                              │
│                                                             │
│   CTR 轉變：                                                │
│   ┌─────────────────────────────────────────────┐         │
│   │  計數器區塊 = [Nonce || 計數器]              │         │
│   │       │                                      │         │
│   │       ↓                                      │         │
│   │  Encrypt_K( 計數器區塊 ) = Keystream         │         │
│   │       │                                      │         │
│   │       ↓                                      │         │
│   │  Keystream ⊕ 明文 = 密文                     │         │
│   │       │                                      │         │
│   │       ↓                                      │         │
│   │  相同 keystream ⊕ 密文 = 明文                │         │
│   └─────────────────────────────────────────────┘         │
│                                                             │
│   就像用一次性密碼本做 XOR！                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CTR 點運作

```
┌─────────────────────────────────────────────────────────────┐
│                      CTR 模式                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │
│   │  Nonce  │ + │   CTR   │ = │  區塊   │   │  區塊   │   │
│   │ (unique)│   │ (0,1,2) │   │  輸入   │   │  輸入   │   │
│   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   │
│        │             │             │             │         │
│        │             │             ↓             ↓         │
│        │             │       ┌──────────┐   ┌──────────┐   │
│        │             │       │  加密 K  │   │  加密 K  │   │
│        │             │       └────┬─────┘   └────┬─────┘   │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Keystream 區塊                           │  │
│   │         KS₁          KS₂          KS₃         KS₄  │  │
│   └─────────────────────────────────────────────────────┘  │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐   │
│   │   P₁   │ ⊕  │   P₂   │ ⊕  │   P₃   │ ⊕  │   P₄   │   │
│   └────┬───┘    └────┬───┘    └────┬───┘    └────┬───┘   │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐   │
│   │   C₁   │    │   C₂   │    │   C₃   │    │   C₄   │   │
│   └────────┘    └────────┘    └────────┘    └────────┘   │
│                                                             │
│   加密輸出：C₁, C₂, C₃, C₄...                                │
│   （注意：CTR 亦可以喺單個字节上運作）                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CTR 解密（相同操作！）

```
┌─────────────────────────────────────────────────────────────┐
│                  CTR 解密                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   CTR 嘅漂亮特性：                                          │
│   解密 = 加密（相同操作！）                                  │
│                                                             │
│   C₁ = P₁ ⊕ Encrypt_K( Nonce || 0 )                         │
│   P₁ = C₁ ⊕ Encrypt_K( Nonce || 0 )  ← 一樣！              │
│                                                             │
│   呢個意味住加密同解密使用完全相同嘅代碼！                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CTR 特性

```
┌─────────────────────────────────────────────────────────────┐
│                  CTR 特性                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ 優點：                                                 │
│   • 將區塊加密變成流加密                                    │
│   • 加密同解密都可以並行化                                  │
│   • 隨機訪問：如果知道你知計數器值，可以直接解密任何區塊       │
│     （唔需要處理之前嘅區塊）                                 │
│   • 唔需要填充（可以加密任意長度）                           │
│   • 實現簡單                                                │
│                                                             │
│   ❌ 缺點：                                                 │
│   • 永遠唔好重用 nonce + 計數器組合（災難性！）             │
│   • 冇內置認證                                              │
│                                                             │
│   ⚠️  關鍵 nonce 要求：                                    │
│      • Nonce 每個 session 必須唯一                          │
│      • 計數器喺每個 session 內永遠唔可以重複                 │
│      • 通常：64-bit nonce + 64-bit 計數器                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 模式 4：GCM（Galois/Counter Mode）— 黃金標準

而家到我哋嘅 **GCM** —— 你喺現代安全系統中最常遇到嘅模式：TLS 1.3、SSH、IPsec 等等。

### 咩係 GCM 咁特別？

```
┌─────────────────────────────────────────────────────────────┐
│              GCM = CTR + 認證                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                    GCM                               │  │
│   │  ┌─────────────────────────────────────────────┐    │  │
│   │  │  CTR 模式（保密性）                          │    │  │
│   │  │  • 加密明文                                  │    │  │
│   │  │  • 產生密文                                  │    │  │
│   │  └─────────────────────────────────────────────┘    │  │
│   │                       +                              │  │
│   │  ┌─────────────────────────────────────────────┐    │  │
│   │  │  GHASH（認證）                               │    │  │
│   │  │  • 產生認證標籤                              │    │  │
│   │  │  • 驗證完整性 + 真實性                      │    │  │
│   │  └─────────────────────────────────────────────┘    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   輸出：[密文] + [認證標籤]                                  │
│                                                             │
│   呢個就係 AEAD（帶關聯數據嘅認證加密）嘅意思！              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### GCM 組件概覽

```
┌─────────────────────────────────────────────────────────────┐
│                   GCM 兩個組件                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   組件 1：CTR 加密（保密性）                                 │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  同我哋之前學嘅 CTR 模式一樣！                         │  │
│   │  計數器 = [IV (unique)] || [counter]                 │  │
│   │  Cᵢ = Pᵢ ⊕ Encrypt_K( Counterᵢ )                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   組件 2：GHASH（認證）                                      │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  • 喺密文區塊上做多項式雜湊                           │  │
│   │  • 使用 Galois field (GF(2¹²⁸)) 算術               │  │
│   │  • 用 XOR 同乘法計算                                  │  │
│   │  • H = Encrypt_K( 0¹²⁸ ) — 一個由密鑰派生嘅特殊值   │  │
│   │    用於所有雜湊操作                                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 深入研究：GHASH

### Galois Field GF(2¹²⁸)

GHASH 使用 GF(2¹²⁸) 中嘅特殊算術——一個有限域，其中：

```
┌─────────────────────────────────────────────────────────────┐
│                  Galois Field GF(2¹²⁸)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   • 所有值都係 128-bit 數字                                 │
│   • 加法 = XOR                                              │
│   • 乘法 = 多項式乘法 modulo 一個不可約多項式                 │
│                                                             │
│   GCM 嘅不可約多項式：                                      │
│   P(x) = x¹²⁸ + x⁷ + x² + x + 1                            │
│                                                             │
│   點解咁重要：                                              │
│   • 令個域正確咁「環繞」                                    │
│   • 確保每個非零元素都有乘法逆元（對於雜湊可以驗證但攻擊者   │
│     無法逆向嚟講好關鍵）                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### GHASH 公式

```
┌─────────────────────────────────────────────────────────────┐
│                      GHASH 公式                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   給定區塊：C₁, C₂, C₃... Cₘ                                │
│   同 H = Encrypt_K( 0¹²⁸ )                                  │
│                                                             │
│   GHASH(C₁...Cₘ) =                                          │
│       C₁ · Hᵐ ⊕ C₂ · Hᵐ⁻¹ ⊕ ... ⊕ Cₘ · H¹                │
│                                                             │
│   其中 · = GF(2¹²⁸) 乘法                                   │
│                                                             │
│   簡單啲嚟講：                                              │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  X₀ = 0                                              │  │
│   │  X₁ = C₁ ⊕ X₀ · H  = C₁ · H                         │  │
│   │  X₂ = C₂ ⊕ X₁ · H  = C₂ ⊕ C₁ · H²                  │  │
│   │  X₃ = C₃ ⊕ X₂ · H  = C₃ ⊕ C₂ · H ⊕ C₁ · H³         │  │
│   │  ...                                                 │  │
│   │  Xₘ = Cₘ ⊕ Xₘ₋₁ · H  ← 最終雜湊                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 可視化 GHASH

```
┌─────────────────────────────────────────────────────────────┐
│                 GHASH 計算流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   輸入區塊：C₁, C₂, C₃                                      │
│   密鑰雜湊：H                                               │
│                                                             │
│   步驟 1：                                                  │
│   ┌─────────┐                                               │
│   │ X₀ = 0  │                                               │
│   └────┬────┘                                               │
│        │                                                     │
│        ↓                                                     │
│   ┌─────────┐    ┌─────────┐                                 │
│   │ X₁ =    │ =  │ C₁     │ ⊕ ( X₀ · H )                   │
│   │ C₁·H¹   │    │ (×H¹)  │                                 │
│   └────┬────┘    └─────────┘                                 │
│        │                                                     │
│        ↓                                                     │
│   ┌─────────┐    ┌─────────┐                                 │
│   │ X₂ =    │ =  │ C₂     │ ⊕ ( X₁ · H )                   │
│   │ C₂·H¹⊕  │    │ (×H¹)  │    ┌─────────┐                 │
│   │ C₁·H²   │    │         │    │ X₁·H    │                 │
│   └────┬────┘    └─────────┘    │ (×H¹)  │                 │
│        │                         └─────────┘                 │
│        ↓                                                     │
│   ┌─────────┐    ┌─────────┐                                 │
│   │ X₃ =    │ =  │ C₃     │ ⊕ ( X₂ · H )                   │
│   │ C₃·H¹⊕  │    │ (×H¹)  │    ┌─────────┐                 │
│   │ C₂·H²⊕  │    │         │    │ X₂·H    │                 │
│   │ C₁·H³   │    │         │    │ (×H¹)  │                 │
│   └────┬────┘    └─────────┘    └─────────┘                 │
│        │                                                     │
│        ↓                                                     │
│   ┌─────────────────────────────────────────────────────┐  │
│   │ GHASH = X₃ = C₃·H¹ ⊕ C₂·H² ⊕ C₁·H³                   │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## GCM 加密同認證流程

### 完整 GCM 過程

```
┌─────────────────────────────────────────────────────────────┐
│                   GCM 加密流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   輸入：明文 P₁...Pₙ，關聯數據 A（可選），                    │
│         密鑰 K，初始向量 IV                                  │
│                                                             │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│   步驟 1：計算 H = Encrypt_K( 0¹²⁸ )                        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  K ──▶ [ AES 加密 ] ──▶ H                           │  │
│   │        全零輸入                                      │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   步驟 2：加密計數器區塊（CTR 模式）                         │
│                                                             │
│   每個區塊 i：                                              │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Counterᵢ = IV || (i+1) 以 32-bit 表示              │  │
│   │  Cᵢ = Pᵢ ⊕ Encrypt_K( Counterᵢ )                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   步驟 3：計算 C 區塊嘅 GHASH                               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  len(A) || len(C) ──▶ 附加到 A||C                   │  │
│   │  X = GHASH( A || 0ⁿ || C || 0ⁿ || [len(A)||len(C)]│  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   步驟 4：計算認證標籤                                       │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Tag = ( Encrypt_K( IV || 0³¹ ) ) ⊕ X              │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   輸出：密文 C₁...Cₙ，標籤 T                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### GCM 解密同驗證

```
┌─────────────────────────────────────────────────────────────┐
│                 GCM 解密同驗證                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   輸入：密文 C₁...Cₙ，標籤 T，IV，密鑰 K，                   │
│         關聯數據 A（如果有嘅話）                              │
│                                                             │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│   步驟 1：計算 H = Encrypt_K( 0¹²⁸ )                        │
│                                                             │
│   步驟 2：用接收嘅 C 區塊同 A 重新計算 GHASH                │
│           （必須與被認證嘅內容匹配）                          │
│                                                             │
│   步驟 3：重新計算預期標籤：                                 │
│           Expected_T = Encrypt_K( IV || 0³¹ ) ⊕ X         │
│                                                             │
│   步驟 4：比較 T == Expected_T                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  如果標籤匹配：                                      │  │
│   │     → 用 CTR 模式解密 C 區塊（與之前相同）            │  │
│   │     → 數據係真實嘅 AND 保密嘅                        │  │
│   │                                                      │  │
│   │  如果標籤唔匹配：                                    │  │
│   │     → 立即拒絕                                      │  │
│   │     → 唔好解密（防止時序攻擊！）                      │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 關鍵特性：雜湊子密鑰 H

```
┌─────────────────────────────────────────────────────────────┐
│               雜湊子密鑰 H = Encrypt_K(0¹²⁸)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   H 係通過加密一個全零區塊派生：                             │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                      │  │
│   │    輸入：  00000000 00000000 00000000 00000000      │  │
│   │           00000000 00000000 00000000 00000000      │  │
│   │                    ↓ (AES-256 加密)                  │  │
│   │    輸出：H = 隨機睇嘅 128-bit 值                    │  │
│   │                                                      │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   H 用於一個 session 中所有 GHASH 操作                       │
│   （使用相同 H 認證所有區塊）                                │
│                                                             │
│   特性：                                                    │
│   • 如果 H = 0，GHASH 變得簡單（脆弱！）                     │
│     → GCM 規範要求 H ≠ 0                                   │
│   • H 應該係不可預測嘅                                      │
│   • 如果使用唔當，H 會洩露關於 K 嘅信息                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## GCM 中嘅關聯數據（AAD）

### 咩係 AAD？

GCM 嘅一個強大特性係**關聯數據**——被認證但唔被加密嘅數據：

```
┌─────────────────────────────────────────────────────────────┐
│              GCM 帶有關聯數據（AAD）                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  關聯數據 (A)              密文 (C)                 │  │
│   │  ┌───────────────┐          ┌───────────────┐      │  │
│   │  │ Header        │          │ 加密 payload  │      │  │
│   │  │ Sequence #    │          │ （對窃聽者    │      │  │
│   │  │ Source/Dest   │          │  可見）       │      │  │
│   │  │ Timestamps    │          └───────┬───────┘      │  │
│   │  └───────┬───────┘                 │               │  │
│   │          └──────────┬────────────────┘               │  │
│   │                       ↓                               │  │
│   │              ┌───────────────┐                         │  │
│   │              │    GHASH     │                         │  │
│   │              │  (A || C)    │                         │  │
│   │              └───────┬───────┘                         │  │
│   │                      ↓                                 │  │
│   │              ┌───────────────┐                         │  │
│   │              │  標籤 (T)     │                         │  │
│   │              └───────────────┘                         │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   A 被認證（標籤依賴於 A）但唔被加密                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 實際 AAD 使用場景

```
┌─────────────────────────────────────────────────────────────┐
│                  AAD 使用場景                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. TLS 記錄：                                             │
│      • AAD = 序列號、協議版本、類型                          │
│      • C = 加密嘅 payload                                   │
│      → 攻擊者無法重新排序/重放記錄                           │
│                                                             │
│   2. SSH 通道：                                             │
│      • AAD = 通道 ID、session ID                            │
│      • C = 加密嘅訊息                                       │
│      → 確保訊息屬於正確嘅 session                           │
│                                                             │
│   3. 文件加密：                                             │
│      • AAD = 文件頭/元數據                                  │
│      • C = 加密嘅文件內容                                    │
│      → 元數據無法被篡改而唔被檢測到                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## GCM 安全特性

```
┌─────────────────────────────────────────────────────────────┐
│                  GCM 安全特性                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✅ 保密性                                                 │
│      • CTR 模式提供語義安全                                 │
│      • 相同明文 → 不同密文（用新 IV）                        │
│                                                             │
│   ✅ 認證                                                   │
│      • GHASH 提供完整性 + 真實性                            │
│      • 解密前必須驗證標籤                                   │
│      • 防止偽造                                             │
│                                                             │
│   ✅ AEAD（帶關聯數據嘅認證加密）                            │
│      • 加密數據同時認證密文 AND 未加密嘅關聯數據             │
│                                                             │
│   ⚠️  重要約束：                                           │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  IV (Nonce)：                                        │  │
│   │  • 每個密鑰必須唯一                                   │  │
│   │  • 推薦：96 bits（12 bytes）                          │  │
│   │  • 永遠唔好與相同密鑰重用 IV！                        │  │
│   │  • 最大值：相同密鑰使用 96-bit IV 超過 2³² 次        │  │
│   │    （之後必須輪換密鑰）                               │  │
│   │                                                      │  │
│   │  標籤長度：                                          │  │
│   │  • 預設：128 bits（16 bytes）                         │  │
│   │  • 可以截斷但推薦至少 96 bits                          │  │
│   │  • 截斷會削弱認證強度                                 │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## IV 重用：災難性失敗

```
┌─────────────────────────────────────────────────────────────┐
│           GCM 中 IV 重用：禁忌嘅錯誤                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   如果使用相同密鑰重用相同 IV：                               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  訊息 1：P₁, C₁ = P₁ ⊕ KS                           │  │
│   │  訊息 2：P₂, C₂ = P₂ ⊕ KS  （相同 keystream！）     │  │
│   │                                                      │  │
│   │  攻擊者計算：                                        │  │
│   │  C₁ ⊕ C₂ = (P₁ ⊕ KS) ⊕ (P₂ ⊕ KS) = P₁ ⊕ P₂        │  │
│   │                                                      │  │
│   │  而家攻擊者可以：                                    │  │
│   │  • 將已知明文與恢復嘅 keystream 做 XOR              │  │
│   │  • 解密所有用呢個 IV 加密嘅訊息！                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   現實影響：                                                │
│   • 2013：Cisco VPN 客戶端存在漏洞（IV 碰撞）               │
│   • 2016：TLS 中錯誤使用 GCM（WEP 式弱點）                  │
│                                                             │
│   預防：                                                    │
│   • 每個訊息使用隨機 96-bit IV                              │
│   • 或使用确定性 IV 派生（HDR, ratcheting）                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 完整模式比較

```
┌─────────────────────────────────────────────────────────────┐
│               AES 模式：完整比較                             │
├──────────┬──────────┬───────────┬──────────┬──────────────┤
│   模式   │ 並行加密？│ 內置認證？ │ 需要填充？│   狀態      │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   ECB    │    ✅    │    ❌     │    ✅   │ ❌ 永遠唔用 │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CBC    │    ❌    │    ❌     │    ✅   │ ✅ 舊系統   │
│          │ (鏈式)   │           │          │              │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CTR    │    ✅    │    ❌     │    ❌   │ ✅ 流式     │
│          │          │           │          │ （無 AAD）   │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   OFB    │    ❌    │    ❌     │    ❌   │ ⚠️ 很少用   │
│          │          │           │          │              │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CFB    │    ❌    │    ❌     │    ❌   │ ⚠️ 很少用   │
│          │          │           │          │              │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   GCM    │    ✅    │    ✅     │    ❌   │ ✅ 推薦     │
│          │          │  (AEAD)  │          │   標準       │
├──────────┼──────────┼───────────┼──────────┼──────────────┤
│   CCM    │    ❌    │    ✅     │    ✅   │ ⚠️ 複雜     │
│          │          │  (AEAD)  │          │ （不在此文）  │
└──────────┴──────────┴───────────┴──────────┴──────────────┘
```

### 幾時用咩

```
┌─────────────────────────────────────────────────────────────┐
│                  模式選擇指南                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   📌 GCM (AES-256-GCM)：                                   │
│      • TLS 1.3、SSH、IPsec、WireGuard                     │
│      • 當你需要加密 + 認證時                                │
│      • 現代應用（2015+）                                    │
│                                                             │
│   📌 CTR (AES-256-CTR)：                                   │
│      • 只係需要加密時（唔需要認證）                          │
│      • 如需要可配合獨立 HMAC 使用                            │
│      • 流導向協議                                           │
│                                                             │
│   📌 CBC (AES-256-CBC)：                                   │
│      • 只用於舊系統                                         │
│      • 配合 HMAC-SHA256 做認證                              │
│      • 舊 TLS（< 1.3）                                     │
│                                                             │
│   📌 ECB：                                                  │
│      • 永遠唔好喺真實數據上使用                              │
│      • 只用於加密隨機獨立密鑰                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 總結

```
┌─────────────────────────────────────────────────────────────┐
│                     重點整理                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. AES 係區塊加密 —— 模式令佢有用                        │
│                                                             │
│   2. ECB：❌ 永遠唔好用 —— 會洩漏模式                        │
│                                                             │
│   3. CBC：✅ 加密能力好，冇認證（舊式）                      │
│                                                             │
│   4. CTR：✅ 快速、可並行化、流式                            │
│                                                             │
│   5. GCM：✅ 現代加密嘅標準                                 │
│      • CTR 提供保密性                                       │
│      • GHASH 提供認證                                       │
│      • 支持關聯數據（AEAD）                                 │
│                                                             │
│   6. 關鍵：永遠唔好重用相同密鑰嘅 IV/nonce！                │
│                                                             │
│   7. GCM 俾你需要嘅一切：                                    │
│      • 加密（保密性）                                       │
│      • 認證（邊發送嘅？）                                   │
│      • 完整性（被篡改咗嗎？）                                │
│      • 關聯數據（認證未加密嘅 header）                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

理解呢啲模式幫助你喺應用中做出明智嘅加密決策——同埋理解點解 GCM 係 TLS 1.3 等現代協議中嘅首選。
