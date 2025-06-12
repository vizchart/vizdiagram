# AIGC 节点创建/更新功能详细文档

## 概述

在 VizCMS 系统中，`node--aigc` 是用于存储 AI 生成内容的核心节点类型。该节点支持多种内容类型（如 Mermaid 图表、ECharts 图表、信息图等），并包含封面图片（cover）字段用于内容预览。

## 核心架构

### 1. 数据结构定义

#### AIGCDataPayload 接口
```typescript
interface AIGCDataPayload {
  title: string        // 标题
  data: string         // JSON 字符串化的内容数据
  cover?: File         // 封面图片文件（可选）
  prompt?: string      // AI 生成提示词（可选）
  reference?: string   // 参考数据（可选）
}
```

#### AIGC 节点属性
```typescript
interface AIGCData {
  id: string
  type: "node--aigc"
  attributes: {
    title: string                // 节点标题
    content_data: string         // JSON 字符串化的内容数据
    content_type: string[]       // 内容类型数组，如 ["mermaid", "echarts"]
    prompt: string              // AI 生成提示词
    cover?: {                   // 封面图片信息
      id: string
      relationships?: {
        field_media_image?: {
          data: {
            id: string
            type: string
          }
        }
      }
    }
  }
  relationships: {
    cover: {                    // 封面图片关联
      data: {
        id: string
        type: "media--image"
      }
    }
  }
}
```

## 2. 核心功能实现

### AIGCStorage 类

位置：`packages/base/src/storage.ts`

```typescript
export class AIGCStorage extends JSONAPIBase {
  #uuid: string | undefined
  #dataType: string

  constructor(props: AIGCStorageConstructor) {
    super(props)
    const { dataType } = props
    this.#dataType = dataType
  }

  // 加载现有节点
  async load<T>(uuid: string) {
    this.#uuid = uuid
    const { data } = await this.JSONApi.get<JSONAPIAIGC>(
      `/jsonapi/node/aigc/${uuid}`,
      {
        params: {
          ["fields[node--aigc]"]: "title,content_data,prompt",
        },
      }
    )
    return {
      title: data.data.attributes.title,
      data: JSON.parse(data.data.attributes.content_data) as T,
      prompt: data.data.attributes.prompt ?? undefined,
    }
  }

  // 保存节点（创建或更新）
  async save(payload: AIGCDataPayload) {
    const purifiedTitle = DOMPurify.sanitize(payload.title, {
      ALLOWED_TAGS: [],
    })
    
    if (this.#uuid) {
      // 更新现有节点
      await this.updateNode(payload, purifiedTitle)
    } else {
      // 创建新节点
      await this.createNode(payload, purifiedTitle)
    }
  }
}
```

## 3. 创建节点流程

### 3.1 创建新节点
```typescript
async createNode(payload: AIGCDataPayload, purifiedTitle: string) {
  // 1. 创建 AIGC 节点
  const {
    data: {
      data: { id: nid },
    },
  } = await this.JSONApi.post<JSONAPIAIGC>("/jsonapi/node/aigc", {
    data: {
      type: "node--aigc",
      attributes: {
        title: purifiedTitle,
        content_data: payload.data,
        content_type: [this.#dataType],  // 如 ["mermaid"]
        prompt: payload.prompt || undefined,
      },
    },
  })

  this.#uuid = nid

  // 2. 如果有封面图片，上传并关联
  if (payload.cover) {
    await this.addImageToNode(payload.cover, nid, "aigc", "cover", purifiedTitle)
  }
}
```

### 3.2 HTTP 请求示例
```http
POST /jsonapi/node/aigc
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "node--aigc",
    "attributes": {
      "title": "我的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\",\"config\":{\"theme\":\"default\"}}",
      "content_type": ["mermaid"],
      "prompt": "创建一个简单的流程图",
    }
  }
}
```

## 4. 更新节点流程

### 4.1 更新现有节点
```typescript
async updateNode(payload: AIGCDataPayload, purifiedTitle: string) {
  // 1. 更新 AIGC 节点属性
  const {
    data: {
      data: { id: nid },
    },
  } = await this.JSONApi.patch<JSONAPIAIGC>(
    `/jsonapi/node/aigc/${this.#uuid}`,
    {
      data: {
        type: "node--aigc",
        id: this.#uuid,
        attributes: {
          title: purifiedTitle,
          content_data: payload.data,
          prompt: payload.prompt || undefined,
        },
      },
    },
    {
      params: {
        include: "cover",  // 包含封面信息
      },
    }
  )

  // 2. 如果有新的封面图片，更新封面
  if (payload.cover) {
    await this.addImageToNode(payload.cover, nid, "aigc", "cover", purifiedTitle)
  }
}
```

### 4.2 HTTP 请求示例
```http
PATCH /jsonapi/node/aigc/{uuid}?include=cover
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "node--aigc",
    "id": "{uuid}",
    "attributes": {
      "title": "更新的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\\n    C --> D[完成]\",\"config\":{\"theme\":\"dark\"}}",
      "prompt": "更新流程图，添加完成步骤",
    }
  }
}
```

## 5. 封面图片处理详解

### 5.1 封面上传流程

封面图片的上传是一个三步骤的过程：

#### 步骤 1: 上传文件到 Drupal 媒体系统
```typescript
async #uploadImageToDrapalMedia(image: File) {
  const sanitizedName = image.name.replace(/[^a-zA-Z0-9.-]/g, "-")
  const { data: res } = await this.JSONApi.post<JSONAPIWithId>(
    "/jsonapi/media/image/field_media_image",
    image,
    {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${sanitizedName}"`,
      },
    }
  )
  return res.data.id  // 返回文件 ID
}
```

#### 步骤 2: 创建媒体实体
```typescript
async #linkFileToMediaImage(fid: string, fname: string) {
  const payload = {
    data: {
      type: "media--image",
      attributes: {
        name: fname,
      },
      relationships: {
        field_media_image: {
          data: {
            id: fid,
            type: "file--file",
          },
        },
      },
    },
  }
  const { data: res } = await this.JSONApi.post<JSONAPIWithId>(
    "/jsonapi/media/image",
    payload
  )
  return res.data.id  // 返回媒体 ID
}
```

#### 步骤 3: 关联媒体到 AIGC 节点
```typescript
protected async addImageToNode(
  file: File,
  nid: string,
  type: string,
  field: string,
  description: string
) {
  const fname = file.name
  const fid = await this.#uploadImageToDrapalMedia(file)
  const mid = await this.#linkFileToMediaImage(fid, fname)

  const patchPath = `/jsonapi/node/${type}/${nid}/relationships/${field}`
  const patchPayload = {
    data: { type: "media--image", id: mid, meta: { description } },
  }

  await this.JSONApi.patch(patchPath, patchPayload)
}
```

### 5.2 封面关联的 HTTP 请求
```http
PATCH /jsonapi/node/aigc/{node_id}/relationships/cover
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "media--image",
    "id": "{media_id}",
    "meta": {
      "description": "节点标题"
    }
  }
}
```

## 6. 各应用中的具体实现

### 6.1 Builder-Mermaid 实现

位置：`apps/builder-mermaid/src/hooks/useImageExport.ts`

```typescript
const handleSave = useCallback(async () => {
  try {
    const isLoggedIn = await api.getLoginStatus()
    if (!isLoggedIn) {
      toast.error(t("error.save.unauthorized"))
      showAuth()
      return
    }
    
    // 生成封面图片
    const coverImage = await getImageFile()
    if (!coverImage) {
      throw new Error("Failed to generate cover image")
    }

    // 保存节点和封面
    await api.save({
      data: JSON.stringify({
        mermaid: chart.mermaid,
        config: chart.config,
      }),
      title: chart.title,
      cover: coverImage,        // 自动生成的封面
      prompt: chart.prompt,
    })

    toast.success(t("mermaid.save.success"))
  } catch (error) {
    toast.error(t("mermaid.save.error"))
    console.error("Error saving chart:", error)
  }
}, [api, getImageFile, chart, toast, t, showAuth])
```

### 6.2 Composer 应用实现

位置：`apps/composer/src/App.tsx`

Composer 应用作为通用的 AIGC 内容生成器，支持多种图表类型：

```typescript
// Composer 配置选项
interface ComposerOptions {
  chart_lib: 'Mermaid' | 'ECharts' | 'Quiz' | 'Mindmap' | 'Cytoscape'
  chart_type: string
  allowed_charts?: string
  show_description?: boolean
  prompt_list?: Array<{
    label: string
    value: string
    description?: string
  }>
}
```

### 6.3 Form-Drupal-Landing-Page 实现

位置：`apps/form-drupal-landing-page/src/App.tsx`

这个应用展示了手动上传封面图片的实现：

```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    // 清理旧的预览 URL
    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview)
    }
    // 创建预览 URL
    const previewUrl = URL.createObjectURL(file)
    setValue("cover", previewUrl)
    setValue("uploadFile", file)
  }
}

const onSubmit = async (data: FormData) => {
  if (!api) return
  setIsSaving(true)
  try {
    await api.save({
      title: data.title,
      cover: data.uploadFile,  // 用户上传的封面文件
    })
    toast.success(t("status.save.success"))
  } catch (error) {
    console.log(error)
    toast.error(t("status.save.error.message"))
  } finally {
    setIsSaving(false)
  }
}
```

## 7. 响应数据结构

### 7.1 创建/更新成功响应
```json
{
  "jsonapi": {
    "version": "1.0",
    "meta": {
      "links": {
        "self": {
          "href": "http://jsonapi.org/format/1.0/"
        }
      }
    }
  },
  "data": {
    "type": "node--aigc",
    "id": "12345678-1234-1234-1234-123456789abc",
    "attributes": {
      "title": "我的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\",\"config\":{\"theme\":\"default\"}}",
      "content_type": ["mermaid"],
      "prompt": "创建一个简单的流程图",
    },
    "relationships": {
      "cover": {
        "data": {
          "id": "media-uuid-12345",
          "type": "media--image"
        }
      }
    },
    "links": {
      "self": {
        "href": "/jsonapi/node/aigc/12345678-1234-1234-1234-123456789abc"
      }
    }
  }
}
```

### 7.2 加载节点响应
```json
{
  "jsonapi": {
    "version": "1.0"
  },
  "data": {
    "type": "node--aigc",
    "id": "12345678-1234-1234-1234-123456789abc",
    "attributes": {
      "title": "我的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\",\"config\":{\"theme\":\"default\"}}",
      "prompt": "创建一个简单的流程图",
    }
  }
}
```

## 8. 错误处理

### 8.1 常见错误类型
```typescript
export enum JSONAPIErrorCodes {
  FORBIDDEN = 403,        // 权限不足
  SPACE_EXCEEDED = -1,    // 存储空间超限
  UNKNOWN = 0,           // 未知错误
}

export class JSONAPIError extends Error {
  public code: JSONAPIErrorCodes
  constructor(code: JSONAPIErrorCodes, message?: string) {
    super(message)
    this.code = code
  }
}
```

### 8.2 错误响应示例
```json
{
  "errors": [
    {
      "status": "403",
      "title": "Forbidden",
      "detail": "Access denied for creating AIGC nodes"
    }
  ]
}
```

## 9. 最佳实践

### 9.1 封面图片优化
- **自动生成封面**：如 Mermaid 应用，自动将图表渲染为 PNG 作为封面
- **尺寸标准化**：建议封面尺寸为 400x400像素
- **格式统一**：使用 PNG 格式确保透明度支持

### 9.2 数据验证
- **标题清理**：使用 DOMPurify 清理标题中的 HTML 标签
- **JSON 验证**：确保 content_data 是有效的 JSON 字符串
- **文件类型检查**：验证上传的封面文件是有效的图片格式

### 9.3 性能优化
- **批量操作**：在更新时使用 `include=cover` 参数减少请求次数

## 10. 安全考虑

### 10.1 认证授权
- 所有操作都需要有效的用户认证
- 使用 CSRF Token 防止跨站请求伪造
- 检查用户对节点的操作权限

### 10.2 文件安全
- 验证上传文件的 MIME 类型
- 限制文件大小和格式
- 对文件名进行安全化处理


## 11. 相关示例代码

```typescript
interface AIGCDataPayload {
  title: string        // 标题
  data: string         // JSON 字符串化的内容数据
  cover?: File         // 封面图片文件（可选）
  prompt?: string      // AI 生成提示词（可选）
  reference?: string   // 参考数据（可选）
}
```

```typescript
interface AIGCData {
  id: string
  type: "node--aigc"
  attributes: {
    title: string                // 节点标题
    content_data: string         // JSON 字符串化的内容数据
    content_type: string[]       // 内容类型数组，如 ["mermaid", "echarts"]
    prompt: string              // AI 生成提示词
    cover?: {                   // 封面图片信息
      id: string
      relationships?: {
        field_media_image?: {
          data: {
            id: string
            type: string
          }
        }
      }
    }
  }
  relationships: {
    cover: {                    // 封面图片关联
      data: {
        id: string
        type: "media--image"
      }
    }
  }
}
```

```typescript
export class AIGCStorage extends JSONAPIBase {
  #uuid: string | undefined
  #dataType: string

  constructor(props: AIGCStorageConstructor) {
    super(props)
    const { dataType } = props
    this.#dataType = dataType
  }

  // 加载现有节点
  async load<T>(uuid: string) {
    this.#uuid = uuid
    const { data } = await this.JSONApi.get<JSONAPIAIGC>(
      `/jsonapi/node/aigc/${uuid}`,
      {
        params: {
          ["fields[node--aigc]"]: "title,content_data,prompt",
        },
      }
    )
    return {
      title: data.data.attributes.title,
      data: JSON.parse(data.data.attributes.content_data) as T,
      prompt: data.data.attributes.prompt ?? undefined,
    }
  }

  // 保存节点（创建或更新）
  async save(payload: AIGCDataPayload) {
    const purifiedTitle = DOMPurify.sanitize(payload.title, {
      ALLOWED_TAGS: [],
    })
    
    if (this.#uuid) {
      // 更新现有节点
      await this.updateNode(payload, purifiedTitle)
    } else {
      // 创建新节点
      await this.createNode(payload, purifiedTitle)
    }
  }
}
```

```typescript
async createNode(payload: AIGCDataPayload, purifiedTitle: string) {
  // 1. 创建 AIGC 节点
  const {
    data: {
      data: { id: nid },
    },
  } = await this.JSONApi.post<JSONAPIAIGC>("/jsonapi/node/aigc", {
    data: {
      type: "node--aigc",
      attributes: {
        title: purifiedTitle,
        content_data: payload.data,
        content_type: [this.#dataType],  // 如 ["mermaid"]
        prompt: payload.prompt || undefined,
      },
    },
  })

  this.#uuid = nid

  // 2. 如果有封面图片，上传并关联
  if (payload.cover) {
    await this.addImageToNode(payload.cover, nid, "aigc", "cover", purifiedTitle)
  }
}
```

```plaintext
POST /jsonapi/node/aigc
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "node--aigc",
    "attributes": {
      "title": "我的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\",\"config\":{\"theme\":\"default\"}}",
      "content_type": ["mermaid"],
      "prompt": "创建一个简单的流程图",
    }
  }
}
```

```typescript
async updateNode(payload: AIGCDataPayload, purifiedTitle: string) {
  // 1. 更新 AIGC 节点属性
  const {
    data: {
      data: { id: nid },
    },
  } = await this.JSONApi.patch<JSONAPIAIGC>(
    `/jsonapi/node/aigc/${this.#uuid}`,
    {
      data: {
        type: "node--aigc",
        id: this.#uuid,
        attributes: {
          title: purifiedTitle,
          content_data: payload.data,
          prompt: payload.prompt || undefined,
        },
      },
    },
    {
      params: {
        include: "cover",  // 包含封面信息
      },
    }
  )

  // 2. 如果有新的封面图片，更新封面
  if (payload.cover) {
    await this.addImageToNode(payload.cover, nid, "aigc", "cover", purifiedTitle)
  }
}
```

```plaintext
PATCH /jsonapi/node/aigc/{uuid}?include=cover
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "node--aigc",
    "id": "{uuid}",
    "attributes": {
      "title": "更新的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\\n    C --> D[完成]\",\"config\":{\"theme\":\"dark\"}}",
      "prompt": "更新流程图，添加完成步骤",
    }
  }
}
```

```typescript
async #uploadImageToDrapalMedia(image: File) {
  const sanitizedName = image.name.replace(/[^a-zA-Z0-9.-]/g, "-")
  const { data: res } = await this.JSONApi.post<JSONAPIWithId>(
    "/jsonapi/media/image/field_media_image",
    image,
    {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${sanitizedName}"`,
      },
    }
  )
  return res.data.id  // 返回文件 ID
}
```

```typescript
async #linkFileToMediaImage(fid: string, fname: string) {
  const payload = {
    data: {
      type: "media--image",
      attributes: {
        name: fname,
      },
      relationships: {
        field_media_image: {
          data: {
            id: fid,
            type: "file--file",
          },
        },
      },
    },
  }
  const { data: res } = await this.JSONApi.post<JSONAPIWithId>(
    "/jsonapi/media/image",
    payload
  )
  return res.data.id  // 返回媒体 ID
}
```

```typescript
protected async addImageToNode(
  file: File,
  nid: string,
  type: string,
  field: string,
  description: string
) {
  const fname = file.name
  const fid = await this.#uploadImageToDrapalMedia(file)
  const mid = await this.#linkFileToMediaImage(fid, fname)

  const patchPath = `/jsonapi/node/${type}/${nid}/relationships/${field}`
  const patchPayload = {
    data: { type: "media--image", id: mid, meta: { description } },
  }

  await this.JSONApi.patch(patchPath, patchPayload)
}
```

```plaintext
PATCH /jsonapi/node/aigc/{node_id}/relationships/cover
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "media--image",
    "id": "{media_id}",
    "meta": {
      "description": "节点标题"
    }
  }
}
```

```typescript
const handleSave = useCallback(async () => {
  try {
    const isLoggedIn = await api.getLoginStatus()
    if (!isLoggedIn) {
      toast.error(t("error.save.unauthorized"))
      showAuth()
      return
    }
    
    // 生成封面图片
    const coverImage = await getImageFile()
    if (!coverImage) {
      throw new Error("Failed to generate cover image")
    }

    // 保存节点和封面
    await api.save({
      data: JSON.stringify({
        mermaid: chart.mermaid,
        config: chart.config,
      }),
      title: chart.title,
      cover: coverImage,        // 自动生成的封面
      prompt: chart.prompt,
    })

    toast.success(t("mermaid.save.success"))
  } catch (error) {
    toast.error(t("mermaid.save.error"))
    console.error("Error saving chart:", error)
  }
}, [api, getImageFile, chart, toast, t, showAuth])
```

```typescript
// Composer 配置选项
interface ComposerOptions {
  chart_lib: 'Mermaid' | 'ECharts' | 'Quiz' | 'Mindmap' | 'Cytoscape'
  chart_type: string
  allowed_charts?: string
  show_description?: boolean
  prompt_list?: Array<{
    label: string
    value: string
    description?: string
  }>
}
```

```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    // 清理旧的预览 URL
    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview)
    }
    // 创建预览 URL
    const previewUrl = URL.createObjectURL(file)
    setValue("cover", previewUrl)
    setValue("uploadFile", file)
  }
}

const onSubmit = async (data: FormData) => {
  if (!api) return
  setIsSaving(true)
  try {
    await api.save({
      title: data.title,
      cover: data.uploadFile,  // 用户上传的封面文件
    })
    toast.success(t("status.save.success"))
  } catch (error) {
    console.log(error)
    toast.error(t("status.save.error.message"))
  } finally {
    setIsSaving(false)
  }
}
```

```json
{
  "jsonapi": {
    "version": "1.0",
    "meta": {
      "links": {
        "self": {
          "href": "http://jsonapi.org/format/1.0/"
        }
      }
    }
  },
  "data": {
    "type": "node--aigc",
    "id": "12345678-1234-1234-1234-123456789abc",
    "attributes": {
      "title": "我的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\",\"config\":{\"theme\":\"default\"}}",
      "content_type": ["mermaid"],
      "prompt": "创建一个简单的流程图",
    },
    "relationships": {
      "cover": {
        "data": {
          "id": "media-uuid-12345",
          "type": "media--image"
        }
      }
    },
    "links": {
      "self": {
        "href": "/jsonapi/node/aigc/12345678-1234-1234-1234-123456789abc"
      }
    }
  }
}
```

```json
{
  "jsonapi": {
    "version": "1.0"
  },
  "data": {
    "type": "node--aigc",
    "id": "12345678-1234-1234-1234-123456789abc",
    "attributes": {
      "title": "我的 Mermaid 流程图",
      "content_data": "{\"mermaid\":\"graph TD\\n    A[开始] --> B[处理]\\n    B --> C[结束]\",\"config\":{\"theme\":\"default\"}}",
      "prompt": "创建一个简单的流程图",
    }
  }
}
```

```typescript
export enum JSONAPIErrorCodes {
  FORBIDDEN = 403,        // 权限不足
  SPACE_EXCEEDED = -1,    // 存储空间超限
  UNKNOWN = 0,           // 未知错误
}

export class JSONAPIError extends Error {
  public code: JSONAPIErrorCodes
  constructor(code: JSONAPIErrorCodes, message?: string) {
    super(message)
    this.code = code
  }
}
```

```json
{
  "errors": [
    {
      "status": "403",
      "title": "Forbidden",
      "detail": "Access denied for creating AIGC nodes"
    }
  ]
}
```
