import React, { useState } from 'react';
import { FormatMessage } from 'components';

import './style/index.less';
import {getPrefix} from '../../../../lib/prefixUtil';

export default React.memo(({dataSource, prefix, onChange}) => {
    //const RadioGroup = Radio.RadioGroup;
    const [checked, setChecked] = useState({
        DDLToggleCase: dataSource.profile?.DDLToggleCase || '',
    });
    const _setChecked = (value, type) => {
        setChecked((pre) => {
            const temp = {
                ...pre,
                [type]: value,
            };
            onChange && onChange(temp);
            return temp;
        });
    };
    const currentPrefix = getPrefix(prefix);
    const items = ['entityDefKey', 'fieldDefKey', 'indexDefKey', 'typeDefKey'];
    // 表名：全部大写|全部小写
    // 字段名：全部大写|全部小写
    // 索引名：全部大写|全部小写
    // 数据类型：全部大写|全部小写
    // 数据库DDL：全部大写|全部小写，这个是打勾（如果选择了后，则生成的DDL，调用下转换大小写函数）
    return <div className={`${currentPrefix}-togglecase`}>
      {
            items.map((i) => {
                return <div key={i} className={`${currentPrefix}-togglecase-item`}>
                  <span className={`${currentPrefix}-togglecase-item-label`}><FormatMessage id={`toggleCase.${i}`}/>:</span>
                  <span className={`${currentPrefix}-togglecase-item-value`}>
                    <span onClick={() => _setChecked('U', i)} className={`${currentPrefix}-togglecase-item-value-${checked[i] === 'U' ? 'checked' : 'default'}`}><FormatMessage id='toggleCase.uppercase'/></span>
                    <span onClick={() => _setChecked('L', i)} className={`${currentPrefix}-togglecase-item-value-${checked[i] === 'L' ? 'checked' : 'default'}`}><FormatMessage id='toggleCase.lowercase'/></span>
                  </span>
                </div>;
            })
        }
      {/*<div className={`${currentPrefix}-togglecase-item`}>*/}
      {/*  <span className={`${currentPrefix}-togglecase-item-label`}>*/}
      {/*    <FormatMessage id='toggleCase.dbDDL'/>:</span>*/}
      {/*  <span className={`${currentPrefix}-togglecase-item-value`}>*/}
      {/*    <RadioGroup*/}
      {/*      name='DDLToggleCase'*/}
      {/*      onChange={e => _setChecked(e.target.value, 'DDLToggleCase')}*/}
      {/*      defaultValue={checked.DDLToggleCase}*/}
      {/*    >*/}
      {/*      <Radio value='U'>*/}
      {/*        <span>*/}
      {/*          <FormatMessage id='toggleCase.uppercase'/>*/}
      {/*        </span>*/}
      {/*      </Radio>*/}
      {/*      <Radio value='L'>*/}
      {/*        <span>*/}
      {/*          <FormatMessage id='toggleCase.lowercase'/>*/}
      {/*        </span>*/}
      {/*      </Radio>*/}
      {/*      <Radio value=''>*/}
      {/*        <span>*/}
      {/*          <FormatMessage id='toggleCase.none'/>*/}
      {/*        </span>*/}
      {/*      </Radio>*/}
      {/*    </RadioGroup>*/}
      {/*  </span>*/}
      {/*</div>*/}
    </div>;
});
