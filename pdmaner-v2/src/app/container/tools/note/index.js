import React, {useEffect, useState, useRef} from 'react';
import {Button, FormatMessage, Modal, Text, ColorPicker} from 'components';

import './style/index.less';
import {getPrefix} from '../../../../lib/prefixUtil';

export default React.memo(({data, prefix, dataChange, dataSource, updateDataSource}) => {
    const isInit = useRef(false);
    const [current, setCurrent] = useState('');
    const [value, setValue] = useState('');
    const [recentColors, setRecentColors] = useState(dataSource.profile?.recentColors || []);
    const [notes, setNotes] = useState(() => {
        if ([...new Set(data.map(d => (d.notes?.tags || []).join('')))].length === 1) {
            return data[0].notes?.tags || [];
        }
        return [];
    });
    const [color, setColor] = useState(() => {
        if ([...new Set(data.map(d => (d.notes?.fontColor || [])))].length === 1) {
            return data[0].notes?.fontColor || '';
        }
        return '';
    });
    const _setColor = (c) => {
        setColor(c);
        let tempRecentColors = [...new Set(recentColors.concat(c))];
        const start = tempRecentColors.length - 8 > 0 ? tempRecentColors.length - 8 : 0;
        tempRecentColors = tempRecentColors.slice(start, tempRecentColors.length);
        setRecentColors(tempRecentColors);
        updateDataSource && updateDataSource({
            ...dataSource,
            profile: {
                ...dataSource.profile,
                recentColors: tempRecentColors,
            },
        });
    };
    const currentPrefix = getPrefix(prefix);
    useEffect(() => {
        if (isInit.current === true) {
            dataChange && dataChange({
                fontColor: color,
                tags: notes,
            });
        } else {
            isInit.current = true;
        }
    }, [color, notes]);
    const onOk = () => {
        setNotes((pre) => {
            if (current) {
                return pre.map((p) => {
                    if (p.id === current) {
                        return {
                            ...p,
                            content: value,
                        };
                    }
                    return p;
                });
            }
            return pre.concat({content: value, id: Math.uuid()});
        });
        setValue('');
        setCurrent('');
    };
    const onEdit = (n) => {
        setCurrent(n.id);
        setValue(n.content);
    };
    const onRemove = (n) => {
        Modal.confirm({
            title: FormatMessage.string({id: 'deleteConfirmTitle'}),
            message: FormatMessage.string({id: 'deleteConfirm'}),
            onOk:() => {
                if (current === n.id) {
                    setCurrent('');
                }
                setNotes((pre) => {
                    return pre.filter(p => p.id !== n.id);
                });
            },
        });
    };
    return <div className={`${currentPrefix}-note`}>
      <div className={`${currentPrefix}-note-left`}>
        <div><span><FormatMessage id='note.note'/></span></div>
        <div>
          <Text
            resize='none'
            placeholder={FormatMessage.string({id: 'note.placeholder'})}
            onChange={e => setValue(e.target.value)}
            value={value}
          />
          <Button disable={!value} type='primary' onClick={onOk}>
            {
                    current ? <FormatMessage id='note.save'/> : <FormatMessage id='note.add'/>
            }
          </Button>
        </div>
        <div>
          {
                notes.map((n, i) => {
                    return <div key={n.id}>
                      <span>{`${i + 1}.${n.content}`}</span>
                      <span>
                        <a onClick={() => onEdit(n)}> <FormatMessage id='note.edit'/></a>
                        <a>{}</a>
                        <a onClick={() => onRemove(n)}> <FormatMessage id='note.remove'/></a>
                      </span>
                    </div>;
                })
            }
        </div>
      </div>
      <div className={`${currentPrefix}-note-right`}>
        <div><span><FormatMessage id='note.noteColor'/></span></div>
        <div>
          <ColorPicker
            restColor='#000000a6'
            recentColors={recentColors}
            color={color}
            onChange={c => _setColor(c.hex)}
          />
        </div>
        <div>
          <span style={{color}}><FormatMessage id='note.noteFontColor'/></span>
        </div>
      </div>
    </div>;
});
