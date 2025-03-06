// 删除表 表更名 增加字段 删除字段 修改字段

import _ from 'lodash/object';
import {_getDefaultTemplate, _transform, _getTemplateString, _getDataByChanges} from './utils';

const refactorEntityFields = (fields, currentDataSource, db) => {
  return fields.map(f => ({...f, ..._transform(f, currentDataSource, db)}));
}


/**
 * 深度比较两个 obj 是否值相同<br/>
 * 会比较 obj 的属性值是否相同<br/>
 * 如果是数组，会按照顺序进行比对, 哪怕元素一样, 顺序不一样也会返回 false <br/>
 * @param x
 * @param y
 * @returns {boolean|this is string[]}
 */
const deepCompareObj = (x, y) => {
    // 如果x或y 都是 null 或者 undefined, 则直接返回 true
    if (x === y) {
        return true;
    }
    // 如果x或y 只有一个是 null 或者 undefined, 则直接返回 false
    if (!x || !y) {
        return false;
    }

    const xKeys = Object.keys(x);
    const yKeys = Object.keys(y);
    if (xKeys.length !== yKeys.length) {
        return false;
    }
    return xKeys.every(key => {
            if (typeof x[key] === 'object' && typeof y[key] === 'object') {
                return deepCompareObj(x[key], y[key]);
            }
            return x[key] === y[key];
        }
    );
};

const compareObj = (current, pre, names, omitNames = [], refactor) => {
  const compareNames = names || [...new Set(Object.keys(current).concat(Object.keys(pre)))];
  return compareNames.filter(n => !omitNames.includes(n)).reduce((p, n) => {
    if (!(n in current) && (n in pre)) {
      return p.concat({opt: 'delete', data: n});
    } else if (!(n in pre) && (n in current)) {
      return p.concat({opt: 'add', data: n});
    } else if (current[n] !== pre[n]) {
      if (refactor && (Array.isArray(current[n]) || Array.isArray(pre[n]))) {
        return p.concat(refactor(current[n], pre[n]));
      }
      if (typeof current[n] === 'object' && deepCompareObj(current[n], pre[n])) {
          // 如果前后值深度比较后相同, 则不进行处理
          return p;
      }
      return p.concat({opt: 'update', data: n, pre: pre[n], new: current[n]});
    }
    return p;
  }, []);
}

const compareArray = (current = [], pre = [], type, names, omitNames, id = 'id', refactor) => {
  const changes = pre.reduce((p, n) => {
    if(current.findIndex(d => d[id] === n[id]) < 0) {
      return p.concat({opt: 'delete', data: {...n, type}, type});
    }
    return p;
  }, []);
  return current.reduce((p, n) => {
    if (pre.findIndex(c => c[id] === n[id]) < 0) {
      return p.concat({opt: 'add', data: n, type});
    } else {
      const cData = n;
      const pData = pre[pre.findIndex(c => c[id] === n[id])];
      let baseChanged;
      const baseChanges = compareObj(cData, pData, names, omitNames, refactor);
      if (baseChanges.length > 0) {
        baseChanged = {
          changeNames: baseChanges.map(c => c.data),
          before: names ? _.pick(pData, names) : pData,
          after:  names ? _.pick(cData, names) : cData,
        }
      }
      if (baseChanged) {
        return p.concat({
          type,
          opt: 'update',
          data: {
            [id]: cData[id],
            ...baseChanged,
          },
        });
      }
      return p;
    }
  }, [...changes]);
}

// 根据变更信息生成SQL
export const getChanges = (changes, currentDataSource, lang) => {
  return _getDataByChanges(changes, currentDataSource, lang);
}

// 根据变更信息生成提示信息
export const getMessageByChanges = (changes, dataSource, lang) => {
  // const getLangString = (type, name) => {
  //   if (type === 'entity' || type === 'view') {
  //     return `tableBase.${name}`;
  //   } else if (type === 'index') {
  //     if (name === 'defKey') {
  //       return 'tableHeaders.indexesName';
  //     } else if (name === 'unique') {
  //       return 'tableHeaders.indexIsUnique';
  //     } else if (name === 'comment') {
  //       return 'tableHeaders.indexComment';
  //     }
  //     return `tableHeaders.${name}`;
  //   }
  //   return `tableHeaders.${name}`;
  // }
  // return changes.reduce((c, n) => {
  //   const parent = n.parent?.[0] || initParent;
  //   if (n.opt === 'update') {
  //     // return c.concat((n.data?.changes || []).reduce((a, b) => {
  //     //   if (b.changes) {
  //     //     return a.concat(getMessageByChanges(b.changes, {
  //     //       defName: `${parent?.defName || parent?.defKey}.${n.data?.oldData?.defName || n.data?.oldData?.defKey}`
  //     //     }, 'fieldDefKey'));
  //     //   }
  //     //   // 1. 修改表[表代码/表名称]，代码：[OLD -> NEW]
  //     //   return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}], ${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}: [${b.pre} -> ${b.new}]`);
  //     //   //return a.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${parent ? `${FormatMessage.string({id: `versionData.${parent.type}`})}[${parent?.defName || parent?.defKey}]` : ''}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}][${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}][${b.pre}===>${b.new}]`);
  //     // }, []));
  //     return c.concat((n.data?.changes || []).reduce((a, b) => {
  //       return a.concat(b.changes ? [] : `${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}], ${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}: [${b.pre} -> ${b.new}]`)
  //           .concat(getMessageByChanges(b.changes || [], {
  //             defName: parent ? `${parent?.defName || parent?.defKey}.${n.data?.oldData?.defName || n.data?.oldData?.defKey}` : `${n.data?.oldData?.defName || n.data?.oldData?.defKey}`
  //           }, 'fieldDefKey'));
  //     }, []));
  //    // return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}], ${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}: [${b.pre} -> ${b.new}]`);
  //   } else if (n.opt === 'delete') {
  //     return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}:${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.[id || 'defName'] || n.data?.defKey}`);
  //   } else {
  //     // 新增字段:表名称.字段名 数据类型
  //     return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}:${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.current?.[id || 'defName'] || n.data?.current?.defKey}${(n.data?.current?.type && parent) ? ` ${n.data?.current?.type}` : ''}`);
  //   }
  // },  []);
  try {
    const code = _.get(dataSource, 'profile.default.db', dataSource.profile?.dataTypeSupports[0]?.id);
    const allTemplate = _.get(dataSource, 'profile.codeTemplates', []);
    const codeTemplate = allTemplate.filter(t => t.applyFor === code)[0] || {};
    const sqlSeparator = _.get(dataSource, 'profile.sql.delimiter', ';');
    // const DDLToggleCase = dataSource?.profile?.DDLToggleCase || '';
    // if (DDLToggleCase) {
    //   return DDLToggleCase === 'U' ? sqlString.toLocaleUpperCase() : sqlString.toLocaleLowerCase();
    // }
    return _getTemplateString(codeTemplate.message || _getDefaultTemplate(code, 'message', dataSource, lang), {
      changes,
      separator: sqlSeparator,
    }, false, dataSource, code);
  } catch (e) {
    return JSON.stringify(e.message, null, 2);
  }
};

export const simplePackageChanges = (currentDataSource, preDataSource, db, needRefactor) => {
  const setNull = (data) => {
    if (data.length > 0) {
      return data;
    }
    return null;
  };
  const ignoreCase = (data) => {
    // 忽略名字和类型的大小写
    const parseNumber = (d) => {
      const n = parseInt(d, 10);
      if (isNaN(n)) {
        return d;
      }
      return n;
    }
    return data.map(d => {
      const fields = (d.fields || []).map(f => {
        return {
          ...f,
          defKey: f.defKey?.toLocaleLowerCase(),
          originDefKey: f.defKey,
          originType: f.type,
          type: f.type?.toLocaleLowerCase(),
          len: f.len === null ? '' : parseNumber(f.len),
          scale: f.scale === null ? '' : parseNumber(f.scale),
        }
      });
      return {
        ...d,
        defKey: d.defKey?.toLocaleLowerCase(),
        originDefKey: d.defKey,
        fields,
        indexes: id2FieldDefKey(d.indexes, fields),
      }
    })
  };
  const currentDb = db || _.get(currentDataSource, 'profile.default.db', currentDataSource.profile?.dataTypeSupports[0]?.id);
  const currentData = ignoreCase(currentDataSource.entities.map(e => {
    return {
      ...e,
      fields: (e.fields || [])
          .map(f => ({...f, ..._transform(f, currentDataSource, currentDb)}))
    }
  }));
  const currentDbData = currentDataSource.profile?.dataTypeSupports?.filter(d => d.id === currentDb)[0];
  const preDb = preDataSource.profile?.dataTypeSupports?.filter(d => d?.defKey?.toLocaleLowerCase() === currentDbData?.defKey?.toLocaleLowerCase())[0]?.id
      || _.get(preDataSource, 'profile.default.db', preDataSource.profile?.dataTypeSupports[0]?.id);
  const preData = ignoreCase(needRefactor ? (preDataSource.entities || []).map(e => {
    return {
      ...e,
      fields: (e.fields || [])
          .map(f => ({...f, ..._transform(f, preDataSource,  preDb)}))
    }
  }) : preDataSource.entities);
  const type = 'entity';
  const changes = [];
   preData.forEach((p) => {
    if(currentData.findIndex(d => d.defKey === p.defKey) < 0) {
      changes.push({opt: 'delete', data: {...p, type}, type});
    }
  });
  return currentData.reduce((p, n) => {
    if (preData.findIndex(c => c.defKey === n.defKey) < 0) {
      return p.concat({opt: 'add', data: {...n, type}, type});
    } else {
      const cData = n;
      const pData = preData[preData.findIndex(c => c.defKey === n.defKey)];
      // 1.比较基础信息
      let baseChanged, fieldChanged;
      const baseNames = ['defKey', 'defName', 'comment'];
      const baseChanges = compareObj(cData, pData, baseNames);
      if (baseChanges.length > 0) {
        baseChanged = {
          changeNames: baseChanges.map(c => c.data),
          before: _.pick({
            ...pData,
            defKey: pData.originDefKey,
          }, baseNames),
          after:  _.pick({
            ...cData,
            defKey: cData.originDefKey,
          }, baseNames)
        }
      }
      // 2.字段调整
      const fieldsChange = compareArray(cData.fields, pData.fields, 'field',
          ['defName', 'comment', 'type', 'len', 'scale'], [], 'defKey');
      if (fieldsChange.length > 0) {
        fieldChanged = {
          fieldAdded: setNull(fieldsChange.filter(c => c.opt === 'add').map(c => {
            const index = cData.fields.findIndex(f => f.id === c.data.id);
            return {
              ...c.data,
              index,
              defKey: c.data.originDefKey,
              type: c.data.originType,
              beforeFieldKey: cData.fields[index + 1]?.originDefKey || null,
              afterFieldKey: cData.fields[index - 1]?.originDefKey || null,
            }
          })),
          fieldRemoved: setNull(fieldsChange.filter(c => c.opt === 'delete').map(c => ({
            ...c.data,
            defKey: c.data.originDefKey,
            type: c.data.originType,
          }))),
          fieldModified: setNull(fieldsChange.filter(c => c.opt === 'update').map(c => {
            const cFIndex = (cData.fields || []).findIndex(f => f.defKey === c.data.defKey);
            const cF = (cData.fields || [])[cFIndex];
            const pFIndex = (pData.fields || []).findIndex(f => f.defKey === c.data.defKey);
            const pF =  (pData.fields || [])[pFIndex];
            return {
              ...c.data,
              defKey: cF.originDefKey || c.defKey,
              after: {
                ...cF,
                ...c.data.after,
                type: cF.originType,
              },
              before: {
                ...pF,
                ...c.data.before,
                type: pF.originType,
              }
            }
          }))
        }
      }
      if (baseChanged || fieldChanged) {
        return p.concat({
          type,
          opt: 'update',
          data: {
            id: cData.id,
            baseInfo: _.pick({
              ...cData,
              defKey: cData.originDefKey
            }, baseNames),
            baseChanged: baseChanged || null,
            fieldAdded: null,
            fieldRemoved: null,
            fieldModified: null,
            propAdded: null,
            propRemoved: null,
            propModified: null,
            refEntityAdd: null,
            refEntityRemoved: null,
            indexAdded: null,
            indexRemoved: null,
            indexModified: null,
            ...fieldChanged,
            fullFields: (cData.fields || []).map(f => ({
              ...f,
              defKey:f.originDefKey,
              type: f.originType,
            })),
            newIndexes: cData.indexes || [],
          },
        });
      }
      return p;
    }
  }, changes).map(d => {
    if (d.opt !== 'update') {
      return {
        ...d,
        data: {
          ...d.data,
          defKey: d.data.originDefKey,
          fields: (d.data.fields || []).map(f => {
            return {
              ...f,
              defKey: f.originDefKey,
              type: f.originType,
            }
          })
        }
      }
    }
    return d;
  });
};

const id2FieldDefKey = (indexes = [], fields) => {
  return indexes.map(i => {
    return {
      ...i,
      fields: (i.fields || []).map(f => {
        const refFieldIndex = fields.findIndex(field => field.id === f.fieldDefKey);
        if(refFieldIndex > -1) {
          return {
            ...f,
            fieldDefKey: fields[refFieldIndex].defKey,
          };
        }
        return f;
      }),
    }
  })
}

export const packageChanges = (currentDataSource, preDataSource, db) => {
  const assembling = (current = [], pre = [], type) => {
    const setNull = (data) => {
      if (data.length > 0) {
        return data;
      }
      return null;
    };
    const refactorData = (d, c) => {
      const fields = refactorEntityFields(d.fields || [], c, db);
      const viewData = {};
      if (d.refEntities && d.refEntities.length > 0) {
        viewData.refEntities = (c.entities || [])
            .filter(e => d.refEntities.includes(e.id)).map(e => e.defKey);
      }
      return {
        ...d,
        fields,
        indexes: id2FieldDefKey(d.indexes, fields),
        ...viewData,
      }
    }
    const currentData = current.map(d => refactorData(d, currentDataSource));
    const preData = pre.map(d => refactorData(d, preDataSource));
    const changes = [];
    const allData = preData.reduce((p, n) => {
      if(p.findIndex(d => d.id === n.id) < 0) {
        changes.push({opt: 'delete', data: {...n, type}, type});
        return p.concat(n);
      }
      return p;
    }, [...currentData]);
    return currentData.reduce((p, n) => {
      if (preData.findIndex(c => c.id === n.id) < 0) {
        return p.concat({opt: 'add', data: {...n, type}, type});
      } else {
        const cData = n;
        const pData = preData[preData.findIndex(c => c.id === n.id)];
        // 1.比较基础信息
        // 'comment', 'defKey', 'defName'
        let baseChanged, propChanged, fieldChanged, refEntityChanged, indexChanged;
        const baseNames = ['comment', 'defKey', 'defName'];
        const baseChanges = compareObj(cData, pData, baseNames);
        if (baseChanges.length > 0) {
          baseChanged = {
            before: _.pick(pData, baseNames),
            after:  _.pick(cData, baseNames)
          }
        }
        // 2.字段调整
        const fieldsChange = compareArray(cData.fields, pData.fields, 'field', null, ['refDictData', 'extProps', 'domainData', 'uiHintData', 'notes',
          'attr1', 'attr2', 'attr3', 'attr4', 'attr5', 'attr6', 'attr7', 'attr8', 'attr9', 'baseType', 'baseTypeData']);
        if (fieldsChange.length > 0) {
          fieldChanged = {
            fieldAdded: setNull(fieldsChange.filter(c => c.opt === 'add').map(c => {
              const index = cData.fields.findIndex(f => f.id === c.data.id);
              return {
                ...c.data,
                index,
                beforeFieldKey: cData.fields[index + 1]?.defKey || null,
                afterFieldKey: cData.fields[index - 1]?.defKey || null,
              }
            })),
            fieldRemoved: setNull(fieldsChange.filter(c => c.opt === 'delete').map(c => c.data)),
            fieldModified: setNull(fieldsChange.filter(c => c.opt === 'update').map(c => c.data))
          }
        }
        // 3.扩展属性调整
        const propsChange = compareObj(cData.properties || {}, pData.properties || {});
        if (propsChange.length > 0) {
          propChanged = {
            propAdded: setNull(propsChange.filter(c => c.opt === 'add').map(c => {
              return {
                key: c.data,
                value: cData.properties[c.data],
              };
            })),
            propRemoved: setNull(propsChange.filter(c => c.opt === 'delete').map(c => {
              return {
                key: c.data,
                value: pData.properties[c.data],
              };
            })),
            propModified: setNull(propsChange.filter(c => c.opt === 'update').map(c => {
              return {
               before: {
                 key: c.data,
                 value: cData.properties[c.data],
               },
                after: {
                  key: c.data,
                  value: pData.properties[c.data],
                }
              };
            })),
          }
        }
        // 4.关联实体调整
        const refEntityChange = compareArray(cData.correlations || [], pData.correlations || [], type, [], [], 'refEntity');
        if (refEntityChange.length > 0) {
          refEntityChanged = {
            refEntityAdd: setNull(refEntityChange.filter(c => c.opt === 'add').map(c => {
              const data = allData[allData.findIndex(d => d.id === c.data.refEntity)];
              return _.pick(data, baseNames);
            })),
            refEntityRemoved: setNull(refEntityChange.filter(c => c.opt === 'delete').map(c => {
              const data = allData[allData.findIndex(d => d.id === c.data.refEntity)];
              return _.pick(data, baseNames);
            })),
          }
        }
        // 5. 索引调整indexes: Array(1)
        const indexChange = compareArray(cData.indexes || [],
            pData.indexes || [], type, baseNames.concat(['unique', 'fields']), [], 'id', (c, p) => {
          return compareArray(c, p, type);
        });
        if (indexChange.length > 0) {
          const calcIndexField = (fields) => {
            const allFields = cData.fields?.concat(preData.fields || []) || [];
            return fields.map(c => {
              if (c.opt !== 'update') {
                return {
                  ...c.data,
                  fields: allFields.map(a => {
                    const fI = c.data?.fields?.findIndex(f => a.id === f.fieldDefKey);
                    if(fI > -1) {
                      return {
                        ...c.data.fields[fI],
                        fieldDefKey: a.defKey
                      }
                    }
                    return null;
                  }).filter((f) => !!f)
                }
              }
              return {
                ...c.data,
                after: {
                  ...c.data.after,
                  fields: allFields.map(a => {
                    const fI = c.data?.after?.fields?.findIndex(f => a.id === f.fieldDefKey);
                    if(fI > -1) {
                      return {
                        ...c.data.after.fields[fI],
                        fieldDefKey: a.defKey
                      }
                    }
                    return null;
                  }).filter((f) => !!f)
                },
                before: {
                  ...c.data.before,
                  fields: allFields.map(a => {
                    const fI = c.data?.before?.fields?.findIndex(f => a.id === f.fieldDefKey);
                    if(fI > -1) {
                      return {
                        ...c.data.before.fields[fI],
                        fieldDefKey: a.defKey
                      }
                    }
                    return null;
                  }).filter((f) => !!f)
                },
              }
            })
          }
          indexChanged = {
            indexAdded: setNull(calcIndexField(indexChange.filter(c => c.opt === 'add'))),
            indexRemoved: setNull(calcIndexField(indexChange.filter(c => c.opt === 'delete'))),
            indexModified: setNull(calcIndexField(indexChange.filter(c => c.opt === 'update'))),
          }
        }
        if (baseChanged || fieldChanged || propChanged || refEntityChanged || indexChanged) {
          return p.concat({
            type,
            opt: 'update',
            data: {
              id: cData.id,
              baseInfo: _.pick(cData, baseNames),
              baseChanged: baseChanged || null,
              fieldAdded: null,
              fieldRemoved: null,
              fieldModified: null,
              propAdded: null,
              propRemoved: null,
              propModified: null,
              refEntityAdd: null,
              refEntityRemoved: null,
              indexAdded: null,
              indexRemoved: null,
              indexModified: null,
              ...fieldChanged,
              ...propChanged,
              ...refEntityChanged,
              indexChanged: !!indexChanged,
              ...indexChanged,
              fullFields: cData.fields || [],
              newIndexes: cData.indexes || [],
            },
          });
        }
        return p;
      }
    }, [...changes]);
  };
  return assembling(currentDataSource.entities, preDataSource.entities, 'entity')
      .concat(assembling(currentDataSource.views, preDataSource.views, 'view'))
}

export const getMaxVersion = (sortData) => {
  const numArray = sortData[0]?.name?.split('.');
  if (!numArray) {
    return 'v1.0.0';
  }
  return numArray.map((v, i) => {
    if (i === numArray.length - 1) {
      return `${parseInt(v, 10) + 1}`
    }
    return v;
  }).join('.');
}
