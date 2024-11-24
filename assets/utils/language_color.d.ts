/**
 * 本类型定义文件用于描述从以下地址获取的语言数据结构：
 * https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml
 * 
 * 该 YML 文件是我手动转换为 JSON 数据结构的 >_>
 */

/**
 * 描述单个语言的配置信息
 */
export interface LanguageConfig {
    /**
     * 语言的类型，例如 `programming`（编程语言）、`data`（数据格式）、
     * `markup`（标记语言）或 `prose`（文章类）
     */
    type: "programming" | "data" | "markup" | "prose" | string

    /**
     * 语言对应的颜色代码，通常用于 UI 展示（例如 GitHub 中的语言标识颜色）
     * 可选字段
     */
    color?: string

    /**
     * 语言常用的文件扩展名，例如 `.js`、`.ts`
     * 可选字段
     */
    extensions?: string[]

    /**
     * 语言的别名或简称，例如 `JavaScript` 的别名可能是 `JS`
     * 可选字段
     */
    aliases?: string[]

    /**
     * 语法高亮中使用的 TextMate scope
     * 可选字段
     */
    tm_scope?: string

    /**
     * 该语言在 ACE 编辑器中的模式标识
     */
    ace_mode: string

    /**
     * 该语言在 Codemirror 编辑器中的模式标识
     * 可选字段
     */
    codemirror_mode?: string

    /**
     * Codemirror 编辑器中该语言的 MIME 类型
     * 可选字段
     */
    codemirror_mime_type?: string

    /**
     * 与该语言关联的特定文件名，例如 `Makefile`、`Dockerfile`
     * 可选字段
     */
    filenames?: string[]

    /**
     * 与该语言相关的解释器，例如 `python`、`ruby`
     * 可选字段
     */
    interpreters?: string[]

    /**
     * 是否建议为该语言启用自动换行功能
     * 可选字段
     */
    wrap?: boolean

    /**
     * 该语言所属的分组，例如 `Haskell`、`LigoLANG`
     * 可选字段
     */
    group?: string

    /**
     * 该语言的唯一标识符，通常用于内部管理
     */
    language_id: number
}

/**
 * 配置对象的顶层结构，每个键为语言名称
 * 值为对应语言的配置信息
 */
export type Config = Record<string, LanguageConfig>
