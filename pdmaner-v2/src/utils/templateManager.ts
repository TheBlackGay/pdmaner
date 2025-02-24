import type { Table } from '@/types/table'
import Handlebars from 'handlebars'

// 注册自定义助手函数
Handlebars.registerHelper('eq', function(v1, v2) {
  return v1 === v2
})

export interface DatabaseTemplate {
  id: string
  name: string
  type: 'mysql' | 'doris' | 'postgresql' | 'oracle'
  description?: string
  template: string
}

class TemplateManager {
  private static instance: TemplateManager
  private templates: Map<string, DatabaseTemplate>

  private constructor() {
    this.templates = new Map()
    this.initDefaultTemplates()
  }

  public static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager()
    }
    return TemplateManager.instance
  }

  private initDefaultTemplates() {
    // MySQL 默认模板
    this.templates.set('mysql', {
      id: 'mysql',
      name: 'MySQL',
      type: 'mysql',
      description: 'MySQL 默认建表模板',
      template: `CREATE TABLE \`{{name}}\` (
  {{#each fields}}
  \`{{name}}\` {{typeName}}{{#if length}}({{length}}){{/if}}{{#if precision}}({{precision}}{{#if scale}},{{scale}}{{/if}}){{/if}} {{#unless nullable}}NOT NULL{{/unless}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}}{{#if autoIncrement}} AUTO_INCREMENT{{/if}}{{#if comment}} COMMENT '{{comment}}'{{/if}}{{#unless @last}},{{/unless}}
  {{/each}}
  {{#if indexes}}
  {{#each indexes}}
  {{#if @first}},{{/if}}
  {{#if (eq type "UNIQUE")}}UNIQUE KEY{{else}}KEY{{/if}} \`{{name}}\` ({{#each fields}}\`{{field.name}}\`{{#if sort}} {{sort}}{{/if}}{{#unless @last}}, {{/unless}}{{/each}}){{#if comment}} COMMENT '{{comment}}'{{/if}}{{#unless @last}},{{/unless}}
  {{/each}}
  {{/if}}
) ENGINE=InnoDB DEFAULT CHARSET={{charset}} COLLATE={{charset}}_general_ci{{#if comment}} COMMENT='{{comment}}'{{/if}};`
    })

    // Doris 默认模板
    this.templates.set('doris', {
      id: 'doris',
      name: 'Apache Doris',
      type: 'doris',
      description: 'Apache Doris 默认建表模板',
      template: `CREATE TABLE \`{{name}}\` (
  {{#each fields}}
  \`{{name}}\` {{typeName}}{{#if length}}({{length}}){{/if}}{{#if precision}}({{precision}}{{#if scale}},{{scale}}{{/if}}){{/if}} {{#unless nullable}}NOT NULL{{/unless}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}}{{#if comment}} COMMENT "{{comment}}"{{/if}}{{#unless @last}},{{/unless}}
  {{/each}}
) ENGINE=OLAP
UNIQUE KEY(\`id\`)
{{#if comment}}COMMENT "{{comment}}"{{/if}}
DISTRIBUTED BY HASH(\`id\`) BUCKETS 10
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);`
    })

    // PostgreSQL 默认模板
    this.templates.set('postgresql', {
      id: 'postgresql',
      name: 'PostgreSQL',
      type: 'postgresql',
      description: 'PostgreSQL 默认建表模板',
      template: `CREATE TABLE "{{name}}" (
  {{#each fields}}
  "{{name}}" {{typeName}}{{#if length}}({{length}}){{/if}}{{#if precision}}({{precision}}{{#if scale}},{{scale}}{{/if}}){{/if}} {{#unless nullable}}NOT NULL{{/unless}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}}{{#if autoIncrement}} GENERATED ALWAYS AS IDENTITY{{/if}}{{#unless @last}},{{/unless}}
  {{/each}}
  {{#if indexes}}
  {{#each indexes}}
  {{#if @first}},{{/if}}
  CONSTRAINT "{{name}}" {{#if (eq type "UNIQUE")}}UNIQUE{{else}}INDEX{{/if}} ({{#each fields}}"{{field.name}}"{{#if sort}} {{sort}}{{/if}}{{#unless @last}}, {{/unless}}{{/each}}){{#unless @last}},{{/unless}}
  {{/each}}
  {{/if}}
);
{{#if comment}}
COMMENT ON TABLE "{{name}}" IS '{{comment}}';
{{#each fields}}
{{#if comment}}
COMMENT ON COLUMN "{{../name}}"."{{name}}" IS '{{comment}}';
{{/if}}
{{/each}}
{{/if}}`
    })

    // Oracle 默认模板
    this.templates.set('oracle', {
      id: 'oracle',
      name: 'Oracle',
      type: 'oracle',
      description: 'Oracle 默认建表模板',
      template: `CREATE TABLE "{{name}}" (
  {{#each fields}}
  "{{name}}" {{typeName}}{{#if length}}({{length}}){{/if}}{{#if precision}}({{precision}}{{#if scale}},{{scale}}{{/if}}){{/if}} {{#unless nullable}}NOT NULL{{/unless}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}}{{#unless @last}},{{/unless}}
  {{/each}}
  {{#if indexes}}
  {{#each indexes}}
  {{#if @first}},{{/if}}
  CONSTRAINT "{{name}}" {{#if (eq type "UNIQUE")}}UNIQUE{{else}}INDEX{{/if}} ({{#each fields}}"{{field.name}}"{{#if sort}} {{sort}}{{/if}}{{#unless @last}}, {{/unless}}{{/each}}){{#unless @last}},{{/unless}}
  {{/each}}
  {{/if}}
);
{{#if comment}}
COMMENT ON TABLE "{{name}}" IS '{{comment}}';
{{#each fields}}
{{#if comment}}
COMMENT ON COLUMN "{{../name}}"."{{name}}" IS '{{comment}}';
{{/if}}
{{/each}}
{{/if}}`
    })
  }

  public getTemplate(type: string): DatabaseTemplate | undefined {
    return this.templates.get(type)
  }

  public setTemplate(template: DatabaseTemplate) {
    this.templates.set(template.id, template)
  }

  public getAllTemplates(): DatabaseTemplate[] {
    return Array.from(this.templates.values())
  }

  public generateCode(table: Table, templateType: string): string {
    const template = this.getTemplate(templateType)
    if (!template) {
      throw new Error(`Template not found for type: ${templateType}`)
    }

    // 使用 Handlebars 编译模板
    const compiledTemplate = Handlebars.compile(template.template)
    
    // 渲染模板
    return compiledTemplate({
      name: table.name,
      comment: table.comment,
      charset: table.charset || 'utf8mb4',
      fields: table.fields,
      indexes: table.indexes
    })
  }
}

export const templateManager = TemplateManager.getInstance() 