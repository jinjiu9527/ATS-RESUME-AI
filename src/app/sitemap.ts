import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://passatsresume.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // 如果后续有登录页或定价页，可以在下面继续追加
  ]
}