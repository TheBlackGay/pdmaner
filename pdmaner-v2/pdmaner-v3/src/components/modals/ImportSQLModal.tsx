  // 从SQL中提取字段信息
  const extractFields = (sql: string, dbType: string): any[] => {
    const fields: any[] = [];
    
    // 提取字段定义部分
    const fieldDefinitionMatch = sql.match(/\(([^]*)\)/);
    
    if (fieldDefinitionMatch && fieldDefinitionMatch[1]) {
      const fieldDefinitions = fieldDefinitionMatch[1].split(',');
      
      for (let fieldDef of fieldDefinitions) {
        fieldDef = fieldDef.trim();
        
        // 跳过索引定义
        if (/^(KEY|INDEX|UNIQUE|PRIMARY)/i.test(fieldDef)) {
          continue;
        }
        
        // 匹配字段名和类型
        const fieldMatch = fieldDef.match(/^`?(\w+)`?\s+(\w+)(?:\((\d+)(?:,(\d+))?\))?/);
        
        if (fieldMatch) {
          const [, name, type, length, scale] = fieldMatch;
          
          // 检查约束
          const isPrimaryKey = /PRIMARY\s+KEY/i.test(fieldDef);
          const isNotNull = /NOT\s+NULL/i.test(fieldDef);
          const isAutoIncrement = /AUTO_INCREMENT/i.test(fieldDef);
          
          // 提取默认值 - 修复对空字符串的处理
          let defaultValue: string | undefined = undefined;
          
          if (/DEFAULT\s+/i.test(fieldDef)) {
            // 优先匹配带引号的字符串默认值（单引号或双引号）
            const stringMatch = fieldDef.match(/DEFAULT\s+(['"])(.*?)\1/i);
            if (stringMatch) {
              // 直接使用捕获的字符串，即使是空字符串也会保留
              defaultValue = stringMatch[2];
            } else {
              // 匹配不带引号的默认值（如数字、函数名等）
              const nonStringMatch = fieldDef.match(/DEFAULT\s+([^\s,;)]+)/i);
              if (nonStringMatch) {
                defaultValue = nonStringMatch[1];
              }
            }
          }
          
          // 提取注释
          const commentMatch = fieldDef.match(/COMMENT\s+['"](.+?)['"]/i);
          const comment = commentMatch ? commentMatch[1] : '';
          
          fields.push({
            id: Date.now() + Math.random().toString(),
            name,
            code: name,
            type: type.toUpperCase(),
            length: length ? parseInt(length) : undefined,
            scale: scale ? parseInt(scale) : undefined,
            primaryKey: isPrimaryKey,
            notNull: isNotNull,
            autoIncrement: isAutoIncrement,
            defaultValue,
            comment
          });
        }
      }
    }
    
    return fields;
  };