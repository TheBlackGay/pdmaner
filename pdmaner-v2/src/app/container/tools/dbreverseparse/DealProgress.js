import React, {useState, useEffect, useRef} from 'react';
import {Progressbar, NumberInput, Modal, Terminal, FormatMessage, Icon, Button, Tooltip} from 'components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import {getPrefix} from '../../../../lib/prefixUtil';
import {connectDB,  getLogPath, showItemInFolder} from '../../../../lib/middle';

export default React.memo(({prefix, dataSource, config, selectedTable,
                             onOk, onClose, currentDb, dbData}) => {
  const currentPrefix = getPrefix(prefix);
  const [success, setSuccess] = useState([]);
  const [leaveSuccess, setLeaveSuccess] = useState([]);
  const [fail, setFail] = useState([]);
  const [currentCount, setCurrentCount] = useState(0);
  const [isStop, setIsStop] = useState(false);
  const parserRef = useRef(null);
  const currentCountRef = useRef(0);
  const isStopRef = useRef(false);
  const stepRef = useRef(10);
  const finalFail = useRef('');
  const failRef = useRef(null);
  const successRef = useRef(null);
  const dBReverseGetTableDDL = (tables) => {
    return new Promise((resolve, reject) => {
      parserRef.current = connectDB(dataSource, config, {
        ...currentDb.properties,
        tables: tables.map(t => t.originDefKey).join(','),
      }, 'DBReverseGetTableDDL', (data) => {
        //reject();
        if (data.status === 'FAILED') {
          reject(data.body || '');
        } else {
          resolve(data.body.map((d) => {
            const currentTable = tables.filter(t => t.originDefKey === d.defKey)[0];
            const group = currentTable?.group;
            if (dbData.flag === 'LOWCASE') {
              return {
                ...d,
                defName: currentTable?.defName?.split(';')[0] || '',
                comment: currentTable?.comment || currentTable?.defName?.split(';')[1] || '',
                group,
                fields: (d.fields || []).map(f => ({
                  ...f,
                  defKey: f.defKey?.toLocaleLowerCase(),
                  defName: f?.defName?.split(';')[0] || '',
                  comment: f.comment || f?.defName?.split(';')[1] || '',
                  primaryKey: !!f.primaryKey,
                  notNull: !!f.notNull,
                })),
                defKey: d.defKey.toLocaleLowerCase(),
              };
            } else if (dbData.flag === 'UPPERCASE') {
              return {
                ...d,
                defName: currentTable?.defName?.split(';')[0] || '',
                comment: currentTable?.comment || currentTable?.defName?.split(';')[1] || '',
                group,
                fields: (d.fields || []).map(f => ({
                  ...f,
                  defKey: f.defKey?.toLocaleUpperCase(),
                  defName: f?.defName?.split(';')[0] || '',
                  comment: f.comment || f?.defName?.split(';')[1] || '',
                  primaryKey: !!f.primaryKey,
                  notNull: !!f.notNull,
                })),
                defKey: d.defKey.toLocaleUpperCase(),
              };
            }
            return {
              ...d,
              defName: currentTable?.defName?.split(';')[0] || '',
              comment: currentTable?.comment || currentTable?.defName?.split(';')[1] || '',
              group,
              fields: (d.fields || []).map(f => ({
                ...f,
                defName: f?.defName?.split(';')[0] || '',
                comment: f.comment || f?.defName?.split(';')[1] || '',
                primaryKey: !!f.primaryKey,
                notNull: !!f.notNull,
              })),
            };
          }).map((t) => {
            const fields = (t.fields || []).map(f => ({...f, id: Math.uuid()}));
            return {
              ...t,
              type: 'P',
              id: Math.uuid(),
              fields,
              indexes: (t.indexes || []).map(i => ({
                ...i,
                id: Math.uuid(),
                fields: (i.fields || []).map((f) => {
                  return {
                    ...f,
                    fieldDefKey: fields.find(field => field.defKey.toLocaleLowerCase() ===
                                f.fieldDefKey.toLocaleLowerCase())?.id
                        || f.fieldDefKey,
                    id: Math.uuid(),
                  };
                }),
              })),
            };
          }));
        }
      });
    });
  };
  const startParse = async () => {
    const checkStop = () => {
      return isStopRef.current;
    };
    while ((currentCountRef.current < selectedTable.length) && (!checkStop())) {
      const currentTable = selectedTable
          .slice(currentCountRef.current, currentCountRef.current + stepRef.current);
      // eslint-disable-next-line no-await-in-loop
      await dBReverseGetTableDDL(currentTable).then((res) => {
        if(!checkStop()) {
          setSuccess(p => p.concat(res));
          setLeaveSuccess(p => p.concat(res));
        }
        // eslint-disable-next-line no-loop-func
      }).catch((res) => {
        if(!checkStop()) {
          finalFail.current = res;
          setFail(p => p.concat(currentTable));
        }
      }).finally(() => {
        if(!checkStop()){
          setCurrentCount((p) =>  {
            currentCountRef.current = p + currentTable.length;
            return currentCountRef.current;
          });
        }
      });
    }
  };
    useEffect(() => {
      startParse();
      return () => {
        isStopRef.current = true;
        parserRef.current?.kill(0);
      };
    }, []);
    const onStop = (status) => {
      if(status) {
        isStopRef.current = true;
        parserRef.current?.kill(0);
      } else {
        isStopRef.current = false;
        startParse();
      }
      setIsStop(status);
    };
    const stepChange = (e) => {
      stepRef.current = e.target.value || 0;
    };
    const openLog = () => {
      const termReady = (term) => {
              term.write(finalFail.current || '');
            };
            Modal.error({
              bodyStyle: {width: '80%'},
              contentStyle: {width: '100%', height: '100%'},
              title: FormatMessage.string({id: 'dbReverseParse.parseDbError'}),
              message: <div>
                <div style={{textAlign: 'center'}}>
                  <FormatMessage id='dbConnect.log'/><a onClick={showItemInFolder}>{getLogPath()}</a></div>
                <Terminal termReady={termReady}/>
              </div>,
            });
    };
    const addTables = () => {
      onOk(leaveSuccess);
      setLeaveSuccess([]);
    };
    const onButtonCancel = () => {
      if(currentCount === selectedTable.length) {
        onClose();
      } else {
        Modal.confirm({
          title: FormatMessage.string({id: 'dbReverseParse.closeConfirm'}),
          message: FormatMessage.string({id: 'dbReverseParse.closeTitle'}),
          onOk:() => {
            onClose();
          },
        });
      }
    };
    const onButtonOk = () => {
      if(currentCount === selectedTable.length) {
        onOk(leaveSuccess);
        onClose();
      } else {
        Modal.confirm({
          title: FormatMessage.string({id: 'dbReverseParse.saveConfirm'}),
          message: FormatMessage.string({id: 'dbReverseParse.saveTitle'}),
          onOk:() => {
            onOk(leaveSuccess);
            onClose();
          },
        });
      }
    };
    useEffect(() => {
      successRef.current?.scrollToItem(leaveSuccess.length);
      failRef.current?.scrollToItem(fail.length);
    }, [leaveSuccess, fail]);
    return <div className={`${currentPrefix}-dbreverseparse-progress`}>
      <div className={`${currentPrefix}-dbreverseparse-progress-header`}>
        <FormatMessage
          id='dbReverseParse.connectName'
          data={{name: currentDb.defName || currentDb.defKey}}
        />
      </div>
      <div className={`${currentPrefix}-dbreverseparse-progress-body`}>
        <div className={`${currentPrefix}-dbreverseparse-progress-body-item`}>
          <div>
            <FormatMessage id='dbReverseParse.paramsConfig'/>
          </div>
          <div className={`${currentPrefix}-dbreverseparse-progress-body-item-step`}>
            <span>
              <FormatMessage id='dbReverseParse.stepLength'/>
            </span>
            <span>
              <span>
                <FormatMessage id='dbReverseParse.stepCount'/>
              </span>
              <Tooltip force title={<FormatMessage id='dbReverseParse.tableCountTitle'/>}>
                <Icon type='fa-info-circle'/>
              </Tooltip>
              <NumberInput defaultValue={stepRef.current} onChange={stepChange}/>
              <span><FormatMessage id='dbReverseParse.tableCount'/></span>
            </span>
          </div>
        </div>
        <div className={`${currentPrefix}-dbreverseparse-progress-body-item`}>
          <div>
            <FormatMessage id='dbReverseParse.progress'/>
          </div>
          <div className={`${currentPrefix}-dbreverseparse-progress-body-item-progress`}>
            <div>
              <span>
                <FormatMessage id='dbReverseParse.progressStep'/>
              </span>
              <Progressbar
                className={`${currentPrefix}-dbreverseparse-progress-body-item-progress-bar`}
                percent={parseInt(currentCount / selectedTable.length * 100, 10)}
                showPercent/>
              <span>
                <FormatMessage
                  data={{count: selectedTable.length}}
                  id='dbReverseParse.allCount'
                />
              </span>
            </div>
            {
              currentCount === selectedTable.length ? <div><Icon className={`${currentPrefix}-dbreverseparse-progress-body-item-success`} type='fa-smile-o'/><FormatMessage id='dbReverseParse.end'/></div> :
              <div className={`${currentPrefix}-dbreverseparse-progress-body-item-button`}>
                {
                  isStop ? <span onClick={() => onStop(false)}>[<FormatMessage id='dbReverseParse.goOn'/>]</span>
                          : <span onClick={() => onStop(true)}>[<FormatMessage id='dbReverseParse.stop'/>]</span>
                }
              </div>
            }
            <div>
              <div>
                <div>
                  <span><Icon className={`${currentPrefix}-dbreverseparse-progress-body-item-success`} type='fa-check-circle-o'/>
                    <FormatMessage
                      data={{success: success.length, save: success.length - leaveSuccess.length}}
                      id='dbReverseParse.result'
                     />
                  </span>
                  {leaveSuccess.length > 0 && <span onClick={addTables} className={`${currentPrefix}-dbreverseparse-progress-body-item-button`}>[<FormatMessage id='dbReverseParse.saveIncrement'/>]</span>}
                </div>
                <div>
                  <AutoSizer>
                    {({height, width}) => {
                      return <List
                        ref={successRef}
                        height={height}
                        itemCount={leaveSuccess.length}
                        itemSize={21}
                        width={width}
                      >
                        {
                          ({ index, style }) => {
                            const data = leaveSuccess[index];
                            return <div style={style}>
                              {index + 1}.{data.defKey}[{data.defName}]
                            </div>;
                          }
                        }
                      </List>;
                    }}
                  </AutoSizer>
                </div>
              </div>
              <div>
                <div>
                  <span><Icon className={`${currentPrefix}-dbreverseparse-progress-body-item-fail`} type='fa-info-circle'/>
                    <FormatMessage
                      data={{count: fail.length}}
                      id='dbReverseParse.failResult'
                  />
                  </span>
                  {fail.length > 0 && <span onClick={openLog} className={`${currentPrefix}-dbreverseparse-progress-body-item-button`}>[<FormatMessage id='dbReverseParse.showLog'/>]</span>}
                </div>
                <div>
                  <AutoSizer>
                    {({height, width}) => {
                      return <List
                        height={height}
                        itemCount={fail.length}
                        itemSize={21}
                        width={width}
                        ref={failRef}
                      >
                        {
                          ({ index, style }) => {
                            const data = fail[index];
                            return <div style={style}>
                              {index + 1}.{data.defKey}[{data.defName}]
                            </div>;
                          }
                        }
                      </List>;
                    }}
                  </AutoSizer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`${currentPrefix}-dbreverseparse-progress-footer`}>
        <Button key='onCancel' onClick={onButtonCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>
        <Button type='primary' key='ok' onClick={onButtonOk}>
          <FormatMessage id='button.ok'/>
        </Button>
      </div>
    </div>;
});
