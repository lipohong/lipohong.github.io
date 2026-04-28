---
title: "SSO Series Part 2: Admin Configuration, Auto-Discovery, and the Attribute Mapping Engine | SSO 系列之二：管理員設定、自動發現與屬性映射引擎"
date: 2026-04-27 18:05:00 +0800
categories: [Security, SSO Series]
tags: [sso, configuration, oidc, saml, admin, mapping-engine, typescript, nodejs, assisted_by_ai]
toc: true
---

## Introduction: Managing the Multi-Tenant Identity Chaos

In Part 1, we established the cryptographic foundation of our Enterprise SSO architecture, implementing Envelope Encryption and Strategy Patterns. However, a secure backend is useless if the system administrators cannot easily configure and manage Identity Providers (IdPs). 

Enterprise environments are chaotic. One corporate client might use Azure AD (Entra ID) with OpenID Connect (OIDC), returning claims like `upn` and `preferred_username`. Another client might use a legacy on-premise ADFS server via SAML 2.0, providing XML attributes like `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`. 

We cannot hardcode these mappings. We need a highly dynamic, configuration-driven system. In Part 2, we will build the **Admin Configuration layer**, implement **Auto-Discovery** to save admins from manual data entry, and design a powerful **Attribute Mapping Engine** that normalizes remote IdP claims into standard local user profiles.

---

## 1. The IdP Provider Data Model

Before building the UI or mapping engine, we must define a robust data model. An IdP provider needs to store its protocol, enablement status, PKCE settings, and the encrypted configuration blob we designed in Part 1.

### Clean Architecture: The Entity

```typescript
// src/sso/entities/idp-provider.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProtocolType } from '../enums/protocol-type.enum';

@Entity('idp_providers')
export class IdpProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  providerCode: string; // e.g., 'oidc.azure-prod', 'saml.adfs-legacy'

  @Column({ length: 255 })
  providerName: string; // i18n support key or raw string

  @Column({ type: 'enum', enum: ProtocolType })
  protocolType: ProtocolType;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ default: true })
  autoDiscovery: boolean;

  // Envelope Encrypted Payload (See Part 1)
  @Column({ type: 'text' })
  configEncrypted: string;

  @Column({ type: 'text' })
  configDekWrapped: string;

  @Column({ type: 'jsonb', nullable: true })
  attributeMappings: AttributeMappingConfig[];

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 2. Auto-Discovery: Automating the Setup

Forcing an admin to manually copy-paste Authorization URLs, Token Endpoints, JWKS URIs, and UserInfo Endpoints is a recipe for human error. Both OIDC and SAML 2.0 support metadata discovery.

### OIDC Auto-Discovery (`.well-known/openid-configuration`)
OIDC defines a standardized discovery endpoint. If the issuer URL is `https://login.microsoftonline.com/{tenantId}/v2.0`, appending `/.well-known/openid-configuration` returns a JSON document with every endpoint required to configure the SSO flow.

```typescript
// src/sso/services/oidc-discovery.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface OidcMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

@Injectable()
export class OidcDiscoveryService {
  private readonly logger = new Logger(OidcDiscoveryService.name);

  async fetchMetadata(issuerUrl: string): Promise<OidcMetadata> {
    try {
      // Ensure no trailing slash before appending well-known path
      const baseUrl = issuerUrl.replace(/\/$/, '');
      const discoveryUrl = `${baseUrl}/.well-known/openid-configuration`;

      const response = await axios.get<OidcMetadata>(discoveryUrl, {
        timeout: 5000, // Fail fast on network issues
      });

      const data = response.data;

      // Validate required fields per OIDC spec
      if (!data.issuer || !data.authorization_endpoint || !data.token_endpoint || !data.jwks_uri) {
        throw new BadRequestException('Invalid OIDC discovery document. Missing required endpoints.');
      }

      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch OIDC metadata from ${issuerUrl}`, error.stack);
      throw new BadRequestException(`Could not retrieve metadata. Verify the issuer URL.`);
    }
  }
}
```

### SAML 2.0 Metadata Fetch
SAML metadata is an XML document containing the IdP's Entity ID, the Single Sign-On Service URL (and binding types), and the X.509 signing certificates.

```typescript
// src/sso/services/saml-discovery.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { DOMParser } from '@xmldom/xmldom';

@Injectable()
export class SamlDiscoveryService {
  async fetchMetadata(metadataUrl: string): Promise<any> {
    try {
      const response = await axios.get(metadataUrl, { timeout: 10000 });
      const xmlString = response.data;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      
      // Extract EntityDescriptor
      const entityDescriptor = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:metadata', 'EntityDescriptor')[0];
      if (!entityDescriptor) {
        throw new BadRequestException('Invalid SAML metadata: No EntityDescriptor found.');
      }

      const entityId = entityDescriptor.getAttribute('entityID');
      
      // Extract SSO URL (HTTP-Redirect binding)
      const ssoServices = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:metadata', 'SingleSignOnService');
      let ssoUrl = '';
      for (let i = 0; i < ssoServices.length; i++) {
        if (ssoServices[i].getAttribute('Binding') === 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect') {
          ssoUrl = ssoServices[i].getAttribute('Location');
          break;
        }
      }

      // Extract Signing Certificates
      const keyDescriptors = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:metadata', 'KeyDescriptor');
      const certificates = [];
      for (let i = 0; i < keyDescriptors.length; i++) {
        if (keyDescriptors[i].getAttribute('use') === 'signing' || !keyDescriptors[i].getAttribute('use')) {
          const x509Data = keyDescriptors[i].getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'X509Certificate')[0];
          if (x509Data && x509Data.textContent) {
            certificates.push(x509Data.textContent.trim());
          }
        }
      }

      return { entityId, ssoUrl, certificates };
    } catch (error) {
      throw new BadRequestException('Failed to parse SAML metadata XML.');
    }
  }
}
```

---

## 3. The Attribute Mapping Engine

When a user logs in via SSO, the IdP sends back a payload of claims. We must map these remote claims to our local `User` entity. According to the requirement spec, exactly **one** mapping must be marked as the Identifier (e.g., `Username`, `Email`, or `External User ID`).

### The Mapping Configuration Interface

```typescript
// src/sso/interfaces/attribute-mapping.interface.ts
export enum LocalField {
  USERNAME = 'username',
  EMAIL = 'email',
  STAFF_ID = 'staff_id',
  EXTERNAL_USER_ID = 'ext_user_id',
  DISPLAY_NAME = 'display_name',
  FIRST_NAME = 'first_name',
  LAST_NAME = 'last_name',
}

export enum TransformType {
  NONE = 'NONE',
  LOWERCASE = 'LOWERCASE',
  UPPERCASE = 'UPPERCASE',
  TRIM = 'TRIM',
  REGEX_EXTRACT = 'REGEX_EXTRACT',
  TEMPLATE = 'TEMPLATE',
}

export interface AttributeMappingConfig {
  remoteAttribute: string; // e.g., 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  localField: LocalField;
  isIdentifier: boolean;
  isRequired: boolean;
  defaultValue?: string;
  transformType: TransformType;
  transformConfig?: string; // Regex pattern or Template string
  syncOnLogin: boolean; // Update the local user profile on every login?
  order: number;
}
```

### Building the Transform Engine

A raw claim from an IdP is often messy. A username might be `DOMAIN\JohnDoe` when we only want `johndoe`. We use the Strategy Pattern again to build a transform engine.

```typescript
// src/sso/services/transform-engine.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TransformType } from '../interfaces/attribute-mapping.interface';

@Injectable()
export class AttributeTransformEngine {
  
  applyTransform(value: string, type: TransformType, config?: string): string {
    if (!value) return value;

    switch (type) {
      case TransformType.NONE:
        return value;
        
      case TransformType.LOWERCASE:
        return value.toLowerCase();
        
      case TransformType.UPPERCASE:
        return value.toUpperCase();
        
      case TransformType.TRIM:
        return value.trim();
        
      case TransformType.REGEX_EXTRACT:
        if (!config) throw new InternalServerErrorException('Regex transform requires a config pattern.');
        const regex = new RegExp(config);
        const match = regex.exec(value);
        // Return the first capture group, or the full match, or original value if no match
        return match && match.length > 1 ? match[1] : (match ? match[0] : value);
        
      case TransformType.TEMPLATE:
        if (!config) throw new InternalServerErrorException('Template transform requires a config string.');
        // Replace {value} with the actual value (e.g., config="EMP-{value}" -> "EMP-12345")
        return config.replace(/{value}/g, value);
        
      default:
        return value;
    }
  }
}
```

### Executing the Mapping Pipeline

When the IdP callback succeeds, the protocol strategy passes the raw JSON payload to the `AttributeMappingEngine`.

```typescript
// src/sso/services/attribute-mapper.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { AttributeMappingConfig, LocalField } from '../interfaces/attribute-mapping.interface';
import { AttributeTransformEngine } from './transform-engine.service';
import { SsoUserClaims } from '../dto/sso-user-claims.dto';

@Injectable()
export class AttributeMapperService {
  constructor(private readonly transformEngine: AttributeTransformEngine) {}

  mapPayload(rawPayload: Record<string, any>, mappings: AttributeMappingConfig[]): SsoUserClaims {
    const result = new SsoUserClaims();
    
    // Validate mappings setup
    const identifierMappings = mappings.filter(m => m.isIdentifier);
    if (identifierMappings.length !== 1) {
      throw new BadRequestException('SSO Provider configuration error: Exactly one identifier mapping is required.');
    }

    // Sort mappings by order to ensure dependent transforms run correctly if needed later
    const sortedMappings = [...mappings].sort((a, b) => a.order - b.order);

    for (const mapping of sortedMappings) {
      let rawValue = rawPayload[mapping.remoteAttribute];

      // Handle missing required fields
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        if (mapping.isRequired && !mapping.defaultValue) {
          throw new BadRequestException(`Required attribute missing from IdP: ${mapping.remoteAttribute}`);
        }
        rawValue = mapping.defaultValue || undefined;
      }

      if (rawValue !== undefined) {
        // Apply Transform
        const transformedValue = this.transformEngine.applyTransform(
          String(rawValue), 
          mapping.transformType, 
          mapping.transformConfig
        );

        // Map to local field
        result[mapping.localField] = transformedValue;
        
        // Track the identifier specifically
        if (mapping.isIdentifier) {
          result.identifierField = mapping.localField;
          result.identifierValue = transformedValue;
        }

        // Track sync-on-login fields
        if (mapping.syncOnLogin && !mapping.isIdentifier) {
          result.fieldsToSync[mapping.localField] = transformedValue;
        }
      }
    }

    if (!result.identifierValue) {
      throw new BadRequestException('Could not resolve an identifier from the SSO payload.');
    }

    return result;
  }
}
```

---

## 4. Default Mappings Pre-population

To save admins time, when they select OIDC or SAML in the UI, we should pre-populate sensible defaults. OIDC uses standard claims, while SAML often uses URI schemas.

```typescript
// Pre-populated defaults for OIDC
export const DefaultOidcMappings: AttributeMappingConfig[] = [
  {
    remoteAttribute: 'sub',
    localField: LocalField.EXTERNAL_USER_ID,
    isIdentifier: true,
    isRequired: true,
    transformType: TransformType.NONE,
    syncOnLogin: false, // Identifiers should be stable
    order: 1,
  },
  {
    remoteAttribute: 'email',
    localField: LocalField.EMAIL,
    isIdentifier: false,
    isRequired: false,
    transformType: TransformType.LOWERCASE,
    syncOnLogin: true, // Email might change at IdP
    order: 2,
  },
  {
    remoteAttribute: 'name',
    localField: LocalField.DISPLAY_NAME,
    isIdentifier: false,
    isRequired: false,
    transformType: TransformType.TRIM,
    syncOnLogin: true,
    order: 3,
  }
];
```

## Conclusion

In Part 2, we have built the administrative backbone of our SSO system. The combination of Auto-Discovery and a robust Attribute Mapping Engine ensures that our application can adapt to any Identity Provider, no matter how archaic or idiosyncratic their claim structure is. The Transform Engine allows us to clean up messy data using Regex and Templates before it ever touches our database.

In Part 3, we will dive into the **SSO User Matching & ENFORCED Linking Architecture**, exploring what happens when the mapped data hits the database, how we link accounts, and how we implement the mandatory SSO linking flow.

<br><br><br>

---
---

## 簡介：管理多租戶身份嘅混亂世界

喺第一集，我哋為企業級 SSO 架構打好咗密碼學嘅根基，實作咗信封加密 (Envelope Encryption) 同埋策略模式 (Strategy Patterns)。不過，如果系統管理員 (System Admins) 覺得好難去 Config 同埋 Manage 啲 Identity Providers (IdPs)，個 Backend 寫得幾 Secure 都係廢嘅。

企業環境係極度混亂嘅。呢個客可能用 Azure AD (Entra ID) 玩 OpenID Connect (OIDC)，掟返嚟嘅 Claims 叫 `upn` 同 `preferred_username`；另一個客可能用緊部封塵嘅 On-premise ADFS Server 玩 SAML 2.0，俾啲 XML Attributes 叫 `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`。

我哋絕對唔可以寫死 (Hardcode) 呢啲 Mappings。我哋需要一個高度動態、Configuration-driven 嘅系統。喺第二集，我哋會構建 **管理員設定層 (Admin Configuration layer)**，實作 **自動發現 (Auto-Discovery)** 嚟拯救 Admin 脫離人手 Copy-paste 嘅地獄，同埋設計一個火力強大嘅 **屬性映射引擎 (Attribute Mapping Engine)**，將遙遠 IdP 亂七八糟嘅 Claims，精準咁 Normalize 做我哋 Local 嘅標準 User Profile。

---

## 1. IdP Provider 資料模型 (Data Model)

喺起 UI 或者 Mapping engine 之前，我哋一定要定義好一個 Robust 嘅 Data Model。一個 IdP provider 需要裝住佢嘅 Protocol 類型、開關狀態、PKCE 設定，同埋我哋喺第一集設計嗰嚿「加密設定 Blob」。

### Clean Architecture: Entity 設計

```typescript
// src/sso/entities/idp-provider.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProtocolType } from '../enums/protocol-type.enum';

@Entity('idp_providers')
export class IdpProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  providerCode: string; // 例如：'oidc.azure-prod', 'saml.adfs-legacy'

  @Column({ length: 255 })
  providerName: string; // i18n key 或者直接入 String

  @Column({ type: 'enum', enum: ProtocolType })
  protocolType: ProtocolType;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ default: true })
  autoDiscovery: boolean;

  // 信封加密咗嘅 Payload (詳情睇第一集)
  @Column({ type: 'text' })
  configEncrypted: string;

  @Column({ type: 'text' })
  configDekWrapped: string;

  @Column({ type: 'jsonb', nullable: true })
  attributeMappings: AttributeMappingConfig[];

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 2. 自動發現 (Auto-Discovery)：自動化 Setup

如果要逼個 Admin 人手去 Copy-paste 嗰堆 Authorization URLs、Token Endpoints、JWKS URIs 同 UserInfo Endpoints，簡直係等出 Error (Human error)。好彩，OIDC 同 SAML 2.0 都支援 Metadata discovery。

### OIDC 自動發現 (`.well-known/openid-configuration`)
OIDC 定義咗一個標準化嘅 Discovery endpoint。如果 Issuer URL 係 `https://login.microsoftonline.com/{tenantId}/v2.0`，只要喺尾度加上 `/.well-known/openid-configuration`，佢就會 Return 一份 JSON，入面有齊晒 Setup SSO Flow 需要嘅所有 Endpoints。

```typescript
// src/sso/services/oidc-discovery.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface OidcMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

@Injectable()
export class OidcDiscoveryService {
  private readonly logger = new Logger(OidcDiscoveryService.name);

  async fetchMetadata(issuerUrl: string): Promise<OidcMetadata> {
    try {
      // 確保 URL 尾無 Slash 之後先加 well-known path
      const baseUrl = issuerUrl.replace(/\/$/, '');
      const discoveryUrl = `${baseUrl}/.well-known/openid-configuration`;

      const response = await axios.get<OidcMetadata>(discoveryUrl, {
        timeout: 5000, // 網絡有事就 Fail fast
      });

      const data = response.data;

      // 根據 OIDC 規格，驗證 Required fields 齊唔齊
      if (!data.issuer || !data.authorization_endpoint || !data.token_endpoint || !data.jwks_uri) {
        throw new BadRequestException('OIDC discovery document 格式錯。漏咗啲 Required endpoints。');
      }

      return data;
    } catch (error) {
      this.logger.error(`由 ${issuerUrl} 攞 OIDC metadata 失敗`, error.stack);
      throw new BadRequestException(`攞唔到 Metadata。請 Check 吓條 Issuer URL 啱唔啱。`);
    }
  }
}
```

### SAML 2.0 Metadata 提取
SAML 嘅 Metadata 係一份 XML，入面包住 IdP 嘅 Entity ID、Single Sign-On Service URL (同埋佢用邊隻 Binding)，仲有堆 X.509 Signing Certificates。

```typescript
// src/sso/services/saml-discovery.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { DOMParser } from '@xmldom/xmldom';

@Injectable()
export class SamlDiscoveryService {
  async fetchMetadata(metadataUrl: string): Promise<any> {
    try {
      const response = await axios.get(metadataUrl, { timeout: 10000 });
      const xmlString = response.data;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      
      // 抽個 EntityDescriptor 出嚟
      const entityDescriptor = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:metadata', 'EntityDescriptor')[0];
      if (!entityDescriptor) {
        throw new BadRequestException('無效嘅 SAML metadata：搵唔到 EntityDescriptor。');
      }

      const entityId = entityDescriptor.getAttribute('entityID');
      
      // 抽條 SSO URL 出嚟 (優先搵 HTTP-Redirect binding)
      const ssoServices = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:metadata', 'SingleSignOnService');
      let ssoUrl = '';
      for (let i = 0; i < ssoServices.length; i++) {
        if (ssoServices[i].getAttribute('Binding') === 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect') {
          ssoUrl = ssoServices[i].getAttribute('Location');
          break;
        }
      }

      // 抽堆 Signing Certificates 出嚟
      const keyDescriptors = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:metadata', 'KeyDescriptor');
      const certificates = [];
      for (let i = 0; i < keyDescriptors.length; i++) {
        // 如果用嚟 signing 或者冇寫明 use 嘅都當係
        if (keyDescriptors[i].getAttribute('use') === 'signing' || !keyDescriptors[i].getAttribute('use')) {
          const x509Data = keyDescriptors[i].getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'X509Certificate')[0];
          if (x509Data && x509Data.textContent) {
            certificates.push(x509Data.textContent.trim());
          }
        }
      }

      return { entityId, ssoUrl, certificates };
    } catch (error) {
      throw new BadRequestException('解析 SAML metadata XML 失敗。');
    }
  }
}
```

---

## 3. 屬性映射引擎 (Attribute Mapping Engine)

當用戶透過 SSO 登入完，IdP 會掟一舊裝滿 Claims 嘅 Payload 過嚟。我哋必須將呢啲「遙遠嘅 Claims」映射 (Map) 去我哋 Local 嘅 `User` Entity 度。根據 Requirement spec，必須有且只有 **一個** Mapping 會被 Tag 做 Identifier (例如：`Username`, `Email`, 或者 `External User ID`)。

### Mapping Configuration 介面

```typescript
// src/sso/interfaces/attribute-mapping.interface.ts
export enum LocalField {
  USERNAME = 'username',
  EMAIL = 'email',
  STAFF_ID = 'staff_id',
  EXTERNAL_USER_ID = 'ext_user_id',
  DISPLAY_NAME = 'display_name',
  FIRST_NAME = 'first_name',
  LAST_NAME = 'last_name',
}

export enum TransformType {
  NONE = 'NONE',
  LOWERCASE = 'LOWERCASE',
  UPPERCASE = 'UPPERCASE',
  TRIM = 'TRIM',
  REGEX_EXTRACT = 'REGEX_EXTRACT',
  TEMPLATE = 'TEMPLATE',
}

export interface AttributeMappingConfig {
  remoteAttribute: string; // 例如：'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  localField: LocalField;
  isIdentifier: boolean;
  isRequired: boolean;
  defaultValue?: string;
  transformType: TransformType;
  transformConfig?: string; // Regex pattern 或者 Template string
  syncOnLogin: boolean; // 每次登入都 Update 個 Local profile？
  order: number;
}
```

### 構建轉換引擎 (Transform Engine)

IdP 俾嘅 Raw claim 好多時都係污糟邋遢嘅。一個 Username 可能係 `DOMAIN\JohnDoe`，但我哋淨係想要 `johndoe`。我哋再次運用策略模式 (Strategy Pattern) 去寫一個轉換引擎。

```typescript
// src/sso/services/transform-engine.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TransformType } from '../interfaces/attribute-mapping.interface';

@Injectable()
export class AttributeTransformEngine {
  
  applyTransform(value: string, type: TransformType, config?: string): string {
    if (!value) return value;

    switch (type) {
      case TransformType.NONE:
        return value;
        
      case TransformType.LOWERCASE:
        return value.toLowerCase();
        
      case TransformType.UPPERCASE:
        return value.toUpperCase();
        
      case TransformType.TRIM:
        return value.trim();
        
      case TransformType.REGEX_EXTRACT:
        if (!config) throw new InternalServerErrorException('Regex transform 需要俾個 config pattern 佢。');
        const regex = new RegExp(config);
        const match = regex.exec(value);
        // 回傳第一個 Capture group，或者 Full match，乜都 Match 唔到就俾返原狀
        return match && match.length > 1 ? match[1] : (match ? match[0] : value);
        
      case TransformType.TEMPLATE:
        if (!config) throw new InternalServerErrorException('Template transform 需要俾個 config string 佢。');
        // 用真嘅 Value 換走個 {value} (例如 config="EMP-{value}" -> "EMP-12345")
        return config.replace(/{value}/g, value);
        
      default:
        return value;
    }
  }
}
```

### 執行 Mapping Pipeline

當 IdP Callback 成功之後，Protocol strategy 會將嚿 Raw JSON Payload 掟落 `AttributeMappingEngine`。

```typescript
// src/sso/services/attribute-mapper.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { AttributeMappingConfig, LocalField } from '../interfaces/attribute-mapping.interface';
import { AttributeTransformEngine } from './transform-engine.service';
import { SsoUserClaims } from '../dto/sso-user-claims.dto';

@Injectable()
export class AttributeMapperService {
  constructor(private readonly transformEngine: AttributeTransformEngine) {}

  mapPayload(rawPayload: Record<string, any>, mappings: AttributeMappingConfig[]): SsoUserClaims {
    const result = new SsoUserClaims();
    
    // 驗證吓 Mappings setup 係咪合理
    const identifierMappings = mappings.filter(m => m.isIdentifier);
    if (identifierMappings.length !== 1) {
      throw new BadRequestException('SSO Provider 設定出錯：必須有且只有一個 identifier mapping。');
    }

    // 根據 Order 排好隊，確保將來如果有 Dependent transforms 都可以順利 Run
    const sortedMappings = [...mappings].sort((a, b) => a.order - b.order);

    for (const mapping of sortedMappings) {
      let rawValue = rawPayload[mapping.remoteAttribute];

      // 處理唔見咗嘅 Required fields
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        if (mapping.isRequired && !mapping.defaultValue) {
          throw new BadRequestException(`IdP 嗰邊漏咗個 Required attribute: ${mapping.remoteAttribute}`);
        }
        rawValue = mapping.defaultValue || undefined;
      }

      if (rawValue !== undefined) {
        // 套用 Transform 沖涼
        const transformedValue = this.transformEngine.applyTransform(
          String(rawValue), 
          mapping.transformType, 
          mapping.transformConfig
        );

        // 寫入對應嘅 Local field
        result[mapping.localField] = transformedValue;
        
        // 特別 Mark 低個 Identifier
        if (mapping.isIdentifier) {
          result.identifierField = mapping.localField;
          result.identifierValue = transformedValue;
        }

        // 特別 Mark 低邊啲需要 Sync-on-login 嘅 Fields
        if (mapping.syncOnLogin && !mapping.isIdentifier) {
          result.fieldsToSync[mapping.localField] = transformedValue;
        }
      }
    }

    if (!result.identifierValue) {
      throw new BadRequestException('喺 SSO payload 入面搵唔到可以用嚟做 Identifier 嘅值。');
    }

    return result;
  }
}
```

---

## 4. 預載預設 Mappings (Default Mappings)

為咗慳 Admin 嘅時間，當佢哋喺 UI 簡 OIDC 或者 SAML 嗰陣，我哋應該要 Pre-populate 一啲路人皆知嘅 Defaults。OIDC 有佢標準嘅 Claims，而 SAML 就通常用 URI Schema。

```typescript
// OIDC 嘅預設 Mappings
export const DefaultOidcMappings: AttributeMappingConfig[] = [
  {
    remoteAttribute: 'sub',
    localField: LocalField.EXTERNAL_USER_ID,
    isIdentifier: true,
    isRequired: true,
    transformType: TransformType.NONE,
    syncOnLogin: false, // Identifier 應該係穩定唔變嘅
    order: 1,
  },
  {
    remoteAttribute: 'email',
    localField: LocalField.EMAIL,
    isIdentifier: false,
    isRequired: false,
    transformType: TransformType.LOWERCASE, // Email 全部強制變細楷
    syncOnLogin: true, // Email 喺 IdP 嗰邊可能會轉
    order: 2,
  },
  {
    remoteAttribute: 'name',
    localField: LocalField.DISPLAY_NAME,
    isIdentifier: false,
    isRequired: false,
    transformType: TransformType.TRIM,
    syncOnLogin: true,
    order: 3,
  }
];
```

## 結語

喺第二集，我哋為個 SSO 系統起好咗行政管理嘅大脊椎。Auto-Discovery 同埋強大嘅 Attribute Mapping Engine 雙劍合璧，確保咗我哋個 Application 可以適應任何 Identity Provider，無論佢哋啲 Claim 結構幾咁古靈精怪都好。個 Transform Engine 更加容許我哋用 Regex 同埋 Templates，喺啲污糟邋遢嘅 Data 掂到 Database 之前就洗到佢乾乾淨淨。

喺第三集，我哋會潛入 **SSO 用戶匹配與強制連結架構 (SSO User Matching & ENFORCED Linking Architecture)**，睇吓當 Map 好晒嘅 Data 去到 Database 嗰陣會發生咩事、點樣 Link 埋啲 Accounts，同埋點樣實作嗰個強制 (MANDATORY) 嘅 SSO 連結 Flow。

<br><br><br>
