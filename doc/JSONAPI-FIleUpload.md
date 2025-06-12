### 图片上传流程 

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

** URL是根据具体的请求类型，有变化的，参数规则说明如下：**
1. /jsonapi/media/image/field_media_image =>
   /jsonapi/[entity-type-name]/[bundle-type]/[field-name]
2. /jsonapi/media/image => /jsonapi/[entity-type-name]/[bundle-type]

# 当前agic的node类型介绍
entity: node
bundle-type: aigc
有一个引用字段 ref_images，是多值，引用的是file--file，保存当前aigc上传的一些图片
所以，对应的URL请求应该是
upload url: /jsonapi/node/aigc/ref_images
entity update/post: /jsonapi/node/aigc 