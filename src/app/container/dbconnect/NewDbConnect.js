import React, { useCallback, useRef, useState } from 'react';
import { IconTitle, Radio, Input, Icon, Button, Modal, FormatMessage, Tooltip, Select, Terminal } from 'components';
import _ from 'lodash/object';
import { emptyDbConn, getDemoDbConnect } from '../../../lib/datasource_util';
import { openFileOrDirPath, connectDB, showItemInFolder, getLogPath } from '../../../lib/middle';
import './style/index.less';
import { getPrefix } from '../../../lib/prefixUtil';

const Option = Select.Option;

export default React.memo(({ prefix, dataSource, config, dataChange, lang }) => {
  const url = getDemoDbConnect();
  const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
  const dataTypeSupports = _.get(dataSource, 'profile.dataTypeSupports', []).filter((d) => {
    return codeTemplates.find(c => c.applyFor === d.id && c.type === 'dbDDL');
  });
  const defaultDb = _.get(dataSource, 'profile.default.db', dataTypeSupports[0]?.id);
  const [dbConn, updateDbConn] = useState(dataSource?.dbConn || []);
  const [defaultConn, updateDefaultConn] = useState(() => {
    return dbConn.filter(d => d.defKey === dataSource?.profile?.default?.dbConn)[0]?.defKey || '';
  });
  const { properties = {}, defName } = (dbConn.filter(d => d.defKey === defaultConn)[0] || {});
  const propertiesRef = useRef(null);
  propertiesRef.current = properties;
  const currentPrefix = getPrefix(prefix);

  // 数据库连接配置示例
  const jdbcHelp = (
    <div className={`${currentPrefix}-dbconnect-example`}>
      {Object.keys(url).map((o) => (
        <div key={o} className={`${currentPrefix}-dbconnect-example-item`}>
          <div className={`${currentPrefix}-dbconnect-example-item-header`}>
            {`${url[o].defKey} ${o !== 'Doris' ? FormatMessage.string({ id: 'dbConnect.configExample' }) : ''}`}
          </div>
          {o !== 'Doris' && (
            <>
              <div className={`${currentPrefix}-dbconnect-example-item-row`}>
                <span className={`${currentPrefix}-dbconnect-example-item-label`}>driver_class:</span>
                <span className={`${currentPrefix}-dbconnect-example-item-value`}>{url[o].driverClass}</span>
              </div>
              <div className={`${currentPrefix}-dbconnect-example-item-row`}>
                <span className={`${currentPrefix}-dbconnect-example-item-label`}>url:</span>
                <span className={`${currentPrefix}-dbconnect-example-item-value`}>{url[o].url}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );

  // 处理连接列表相关操作
  const handleConnections = {
    add: () => {
      const dataTypeSupport = dataTypeSupports.filter(dataType => dataType.id === defaultDb)[0];
      const empty = {
        ...emptyDbConn,
        defKey: Math.uuid(),
        type: defaultDb,
        properties: {
          driver_class_name: url[dataTypeSupport?.defKey?.toLocaleLowerCase()]?.driverClass || '',
          url: url[dataTypeSupport?.defKey?.toLocaleLowerCase()]?.url || '',
          password: '',
          username: '',
        },
      };
      const newData = dbConn.concat(empty);
      updateDbConn(newData);
      updateDefaultConn(empty.defKey);
      dataChange && dataChange(empty.defKey, 'profile.default.dbConn');
      dataChange && dataChange(newData, 'dbConn');
    },
    copy: () => {
      const newData = { ...dbConn.filter(d => d.defKey === defaultConn)[0], defKey: Math.uuid() };
      handleConnections.add(newData);
    },
    delete: () => {
      const index = dbConn.findIndex(d => d.defKey === defaultConn);
      const newDefaultIndex = (index === dbConn.length - 1) ? index - 1 : index + 1;
      const newData = dbConn.filter(d => d.defKey !== defaultConn);
      updateDbConn(newData);
      updateDefaultConn(dbConn[newDefaultIndex]?.defKey || '');
      dataChange && dataChange(dbConn[newDefaultIndex]?.defKey || '', 'profile.default.dbConn');
      dataChange && dataChange(newData, 'dbConn');
    },
  };

  // 处理表单项变更
  const handleFormChange = {
    connection: (e, name, key) => {
      const newData = dbConn.map((d) => {
        if (d.defKey === key) {
          const dataTypeSupport = dataTypeSupports.filter(dataType => dataType.id === e.target.value)[0];
          const data = url[dataTypeSupport?.defKey?.toLocaleLowerCase()] || {};
          return {
            ...d,
            [name]: e.target.value,
            properties: name === 'type' ? {
              driver_class_name: data.driverClass || '',
              url: data.url || '',
              password: '',
              username: '',
            } : d.properties,
          };
        }
        return d;
      });
      updateDbConn(newData);
      dataChange && dataChange(newData, 'dbConn');
    },
    property: (e, name) => {
      const newData = dbConn.map((d) => {
        if (d.defKey === defaultConn) {
          return {
            ...d,
            properties: {
              ...(d.properties || {}),
              [name]: e.target.value,
            },
          };
        }
        return d;
      });
      updateDbConn(newData);
      dataChange && dataChange(newData, 'dbConn');
    },
  };

  // 测试连接
  const testConnection = useCallback((e, btn) => {
    const requiredFields = ['driver_class_name', 'url'];
    if (requiredFields.some(field => !propertiesRef.current[field])) {
      Modal.error({
        title: FormatMessage.string({ id: 'optFail' }),
        message: FormatMessage.string({ id: 'formValidateMessage' }),
      });
      return;
    }

    btn?.updateStatus('loading');
    connectDB(dataSource, config, { ...propertiesRef.current, lang }, 'PingLoadDriverClass', (result) => {
      btn?.updateStatus('normal');
      if (result.status === 'FAILED') {
        Modal.error({
          bodyStyle: { width: '80%' },
          contentStyle: { width: '100%', height: '100%' },
          title: FormatMessage.string({ id: 'dbConnect.connectError' }),
          message: (
            <div>
              <div style={{ textAlign: 'center' }}>
                <FormatMessage id='dbConnect.log' />
                <a onClick={showItemInFolder}>{getLogPath()}</a>
              </div>
              <Terminal termReady={(term) => term.write(result.body)} />
            </div>
          ),
        });
      } else {
        Modal.success({
          title: FormatMessage.string({ id: 'dbConnect.connectSuccess' }),
          message: result.body,
        });
      }
    });
  }, []);

  return (
    <div className={`${currentPrefix}-dbconnect-container`}>
      {/* 左侧连接列表 */}
      <div className={`${currentPrefix}-dbconnect-list`}>
        <div className={`${currentPrefix}-dbconnect-list-header`}>
          <div className={`${currentPrefix}-dbconnect-list-actions`}>
            <IconTitle
              type='fa-plus'
              onClick={handleConnections.add}
              title={FormatMessage.string({ id: 'dbConnect.add' })}
            />
            <IconTitle
              type='fa-copy'
              onClick={handleConnections.copy}
              title={FormatMessage.string({ id: 'dbConnect.copy' })}
              disabled={!defaultConn}
            />
            <IconTitle
              type='fa-minus'
              onClick={handleConnections.delete}
              title={FormatMessage.string({ id: 'dbConnect.delete' })}
              disabled={!defaultConn}
            />
          </div>
          <div className={`${currentPrefix}-dbconnect-list-title`}>
            {defaultConn ? (
              <span>
                <FormatMessage id='dbConnect.defaultDbConnectDesc' />
                {defName}
              </span>
            ) : (
              <FormatMessage id='dbConnect.defaultDbConnectEmpty' />
            )}
          </div>
        </div>

        <div className={`${currentPrefix}-dbconnect-list-content`}>
          {dbConn.length > 0 ? (
            dbConn.map((conn) => (
              <div key={conn.defKey} className={`${currentPrefix}-dbconnect-list-item`}>
                <Radio
                  value={conn.defKey}
                  onChange={(e) => {
                    updateDefaultConn(e.target.value);
                    dataChange && dataChange(e.target.value, 'profile.default.dbConn');
                  }}
                  checked={defaultConn === conn.defKey}
                />
                <Input
                  className={`${currentPrefix}-dbconnect-list-item-name`}
                  onChange={(e) => handleFormChange.connection(e, 'defName', conn.defKey)}
                  value={conn.defName || ''}
                  placeholder={FormatMessage.string({ id: 'dbConnect.namePlaceholder' })}
                />
                <Select
                  className={`${currentPrefix}-dbconnect-list-item-type`}
                  value={conn.type || defaultDb}
                  onChange={(e) => handleFormChange.connection(e, 'type', conn.defKey)}
                  notAllowEmpty
                >
                  {dataTypeSupports.map((type) => (
                    <Option key={type.id} value={type.id}>
                      {type.defKey}
                    </Option>
                  ))}
                </Select>
              </div>
            ))
          ) : (
            <div className={`${currentPrefix}-dbconnect-list-empty`}>
              <FormatMessage id='dbConnect.emptyConnect' />
            </div>
          )}
        </div>
      </div>

      {/* 右侧配置表单 */}
      {defaultConn && (
        <div className={`${currentPrefix}-dbconnect-form`}>
          <div className={`${currentPrefix}-dbconnect-form-item`}>
            <label>
              <FormatMessage id='dbConnect.customDriver' />
              <Tooltip title={FormatMessage.string({ id: 'dbConnect.customDriverPlaceholder' })}>
                <Icon type='icon-xinxi' />
              </Tooltip>
            </label>
            <Input
              value={properties.customer_driver || ''}
              onChange={(e) => handleFormChange.property(e, 'customer_driver')}
              placeholder={FormatMessage.string({ id: 'dbConnect.customDriverPlaceholder' })}
              suffix={
                <Icon
                  type='fa-ellipsis-h'
                  onClick={() => {
                    openFileOrDirPath(
                      [{ name: FormatMessage.string({ id: 'dbConnect.customDriver' }), extensions: ['jar'] }],
                      ['openFile']
                    ).then((res) => {
                      handleFormChange.property({ target: { value: res } }, 'customer_driver');
                    }).catch((err) => {
                      Modal.error({
                        title: FormatMessage.string({ id: 'openDirError' }),
                        message: err.message || err,
                      });
                    });
                  }}
                />
              }
            />
          </div>

          <div className={`${currentPrefix}-dbconnect-form-item`}>
            <label>
              <span className={`${currentPrefix}-form-item-required`} />
              <FormatMessage id='dbConnect.driver' />
              <Tooltip title={jdbcHelp}>
                <Icon type='icon-xinxi' />
              </Tooltip>
            </label>
            <Input
              value={properties.driver_class_name || ''}
              onChange={(e) => handleFormChange.property(e, 'driver_class_name')}
            />
          </div>

          <div className={`${currentPrefix}-dbconnect-form-item`}>
            <label>
              <span className={`${currentPrefix}-form-item-required`} />
              <FormatMessage id='dbConnect.url' />
              <Tooltip title={jdbcHelp}>
                <Icon type='icon-xinxi' />
              </Tooltip>
            </label>
            <Input
              value={properties.url || ''}
              onChange={(e) => handleFormChange.property(e, 'url')}
            />
          </div>

          <div className={`${currentPrefix}-dbconnect-form-item`}>
            <label>
              <FormatMessage id='dbConnect.username' />
            </label>
            <Input
              value={properties.username || ''}
              onChange={(e) => handleFormChange.property(e, 'username')}
            />
          </div>

          <div className={`${currentPrefix}-dbconnect-form-item`}>
            <label>
              <FormatMessage id='dbConnect.password' />
            </label>
            <Input
              type='password'
              value={properties.password || ''}
              onChange={(e) => handleFormChange.property(e, 'password')}
            />
          </div>

          <div className={`${currentPrefix}-dbconnect-form-actions`}>
            <Button onClick={testConnection}>
              <FormatMessage id='dbConnect.test' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}));