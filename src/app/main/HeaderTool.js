import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {FormatMessage, GroupIcon, Icon, SearchSuggest, Modal} from 'components';
import {validateNeedSave} from '../../lib/datasource_util';
import { checkAlignEnable} from '../../lib/position';
import {READING} from '../../lib/variable';

const GroupIconGroup = GroupIcon.GroupIconGroup;

export default React.memo(forwardRef(({currentPrefix, close, iconClick, openModal,
                                        activeTab, dataSource, mode, isChildWindow,
                                        jumpPosition, jumpDetail, menuType}, ref) => {
  const [isCellSelected, setIsCellSelected] = useState([]);
  const themeMode = dataSource?.profile?.themeMode || 'themeDay';
  const calcIsCellSelected = (isSimple) => {
      if (isSimple) {
          return isCellSelected.length > 0;
      }
      return checkAlignEnable(isCellSelected);
  };
  useImperativeHandle(ref, () => {
    return {
      setIsCellSelected,
    };
  }, []);
  const _close = () => {
    if (validateNeedSave(dataSource)) {
      Modal.confirm({
        title: FormatMessage.string({id: 'closeConfirmTitle'}),
        message: FormatMessage.string({id: 'closeConfirm'}),
        onOk:() => {
          close();
        },
      });
    } else {
      close();
    }
  };
  const checkDisable = () => {
    return activeTab?.type !== 'diagram' || (menuType !== '1' &&  menuType !== '2');
  };
  return <div className={`${currentPrefix}-head ${currentPrefix}-head-${!isChildWindow ? 'normal' : 'view'}`}>
    <div className={`${currentPrefix}-head-logo`}>
      <div className={`${currentPrefix}-head-logo-opt`}>
        {!isChildWindow && <span>
          <Icon type="fa-angle-left" onClick={_close}/>
          </span>}
        <span>{dataSource.name}</span>
      </div>
    </div>
    {mode !== READING && <> <GroupIconGroup>
      <GroupIcon
        className={`${currentPrefix}-head-db`}
        dropType='icon'
        groupKey='save'
        title={FormatMessage.string({id: 'toolbar.save'})}
        icon='fa-floppy-o'
        onClick={iconClick}
        dropMenu={[
               /*{ key: 'save', name: FormatMessage.string({id: 'toolbar.save'})},*/
               { key: 'saveAs', name: FormatMessage.string({id: 'toolbar.saveAs'})},
           ]}/>
      <GroupIcon
        className={`${currentPrefix}-head-db`}
        title={FormatMessage.string({id: 'toolbar.refresh'})}
        onClick={() => iconClick(null, 'refresh')}
        icon='fa-refresh'
       />
      {/* eslint-disable-next-line max-len */}
      {/*<GroupIcon title={FormatMessage.string({id: 'toolbar.opt'})} icon='opt.svg' dropMenu={[]}/>*/}
    </GroupIconGroup>
      <GroupIconGroup>
        <GroupIcon
          draggable
          hoverTitle={checkDisable() ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
          title={FormatMessage.string({id: 'toolbar.emptyEntity'})}
          icon='icon-kongbiao'
          disable={checkDisable()}
               //style={{cursor: 'move'}}
          onClick={iconClick}
          groupKey='empty'
               //onMouseDown={e => iconClick(e, 'empty')}
           />
        <GroupIcon
          draggable
          className={`${currentPrefix}-head-db`}
          hoverTitle={checkDisable() ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
          title={FormatMessage.string({id: 'toolbar.emptyLogic'})}
          icon='fa-columns'
          disable={checkDisable()}
            //style={{cursor: 'move'}}
          onClick={iconClick}
          groupKey='logic'
            //onMouseDown={e => iconClick(e, 'empty')}
        />
        <GroupIcon
          draggable
          className={`${currentPrefix}-head-db`}
          hoverTitle={checkDisable() ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
          title={FormatMessage.string({id: 'toolbar.group'})}
          icon='fa-object-group'
               //style={{cursor: 'move'}}
          onClick={iconClick}
          groupKey='group'
          disable={checkDisable()}
               //onMouseDown={e => iconClick(e, 'group')}
           />
        <GroupIcon
          className={`${currentPrefix}-head-db`}
          dropType='all'
          disable={checkDisable()}
          hoverTitle={checkDisable() ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
          groupKey='shape'
          title={FormatMessage.string({id: 'toolbar.shape'})}
          icon='fa-square-o'
          onClick={iconClick}
          dropMenu={[
                   {draggable: true, icon: <span className={`${currentPrefix}-head-rect`}/>, key: 'rect', name: FormatMessage.string({id: 'toolbar.rect'})},
                   {draggable: true, icon: <span className={`${currentPrefix}-head-round`}/>, key: 'round', name: FormatMessage.string({id: 'toolbar.round'})},
                   {draggable: true, icon: <span className={`${currentPrefix}-head-circle`}/>, key: 'circle', name: FormatMessage.string({id: 'toolbar.circle'})},
                   {draggable: true, icon: <span className={`${currentPrefix}-head-polygon`}/>,  key: 'polygon', name: FormatMessage.string({id: 'toolbar.polygon'})},
               ]}/>
        <GroupIcon
          draggable
          hoverTitle={checkDisable() ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
          title={FormatMessage.string({id: 'toolbar.mind'})}
          icon={<div className={`${currentPrefix}-head-mind ${currentPrefix}-head-mind-${checkDisable() ? 'disable' : 'normal'}`} >
            <div className={`${currentPrefix}-head-mind-img`} />
          </div>}
          groupKey='mind'
          onClick={iconClick}
          disable={checkDisable()}
           />
        <GroupIcon
          topStyle={{height: '24px'}}
          dropType='all'
          disable={checkDisable() || !calcIsCellSelected(false)}
          hoverTitle={checkDisable() ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
          groupKey='alignment'
          title={FormatMessage.string({id: 'toolbar.alignment'})}
          icon='fa-align-left'
          onClick={iconClick}
          dropMenu={[
                   {icon: <span className={`${currentPrefix}-head-alignLeft`}/>, key: 'alignLeft', name: FormatMessage.string({id: 'toolbar.alignLeft'})},
                   {icon: <span className={`${currentPrefix}-head-horizontalCenter`}/>, key: 'horizontalCenter', name: FormatMessage.string({id: 'toolbar.horizontalCenter'})},
                   {icon: <span className={`${currentPrefix}-head-alignRight`}/>,  key: 'alignRight', name: FormatMessage.string({id: 'toolbar.alignRight'})},
                   {icon: <span className={`${currentPrefix}-head-alignTop`}/>, key: 'alignTop', name: FormatMessage.string({id: 'toolbar.alignTop'})},
                   {icon: <span className={`${currentPrefix}-head-verticalCenter`}/>, key: 'verticalCenter', name: FormatMessage.string({id: 'toolbar.verticalCenter'})},
                   {icon: <span className={`${currentPrefix}-head-alignBottom`}/>, key: 'alignBottom', name: FormatMessage.string({id: 'toolbar.alignBottom'})},
                   {icon: <span className={`${currentPrefix}-head-alignRow`}/>, key: 'alignRow', style: {borderTop: '1px solid #DFE3EB'}, name: FormatMessage.string({id: 'toolbar.alignRow'})},
                   {icon: <span className={`${currentPrefix}-head-alignColumn`}/>, key: 'alignColumn', name: FormatMessage.string({id: 'toolbar.alignColumn'})},
               ]}/>
        <GroupIcon
          topStyle={{height: '24px'}}
          dropType='all'
          groupKey='tool'
          title={FormatMessage.string({id: 'toolbar.tool'})}
          icon='fa-briefcase'
          onClick={iconClick}
          dropMenu={[
                   {
                       icon: <svg className={`${currentPrefix}-svg-icon`} aria-hidden="true">
                         <use xlinkHref={themeMode === 'themeDay' ? '#icon-yueduye-yejianmoshi' : '#icon-baitian-qing'}/>
                       </svg>,
                       key: 'theme',
                       name: FormatMessage.string({id: `toolbar.${themeMode === 'themeDay' ? 'themeNigh' : 'themeDay'}`}),
                   },
                   {
                       icon: <svg className={`${currentPrefix}-svg-icon`} aria-hidden="true">
                         <use xlinkHref='#icon-daxiaoxiezhuanhuan'/>
                       </svg>,
                       key: 'toggleCase',
                       name: FormatMessage.string({id: 'toolbar.toggleCase'}),
                   },
                   {
                       icon: <svg className={`${currentPrefix}-svg-icon`} aria-hidden="true">
                         <use xlinkHref='#icon-BOMbijiao'/>
                       </svg>,
                       key: 'compareDb',
                       name: FormatMessage.string({id: 'toolbar.compareDb'}),
                   },
                   {
                       icon: <svg className={`${currentPrefix}-svg-icon`} aria-hidden="true">
                         <use xlinkHref='#icon-bijiao1'/>
                       </svg>,
                       key: 'compareTable',
                       name: FormatMessage.string({id: 'toolbar.compareTable'}),
                   },
               ]}/>
      </GroupIconGroup>
      <GroupIconGroup>
        <GroupIcon
          title={FormatMessage.string({id: 'toolbar.import'})}
          onClick={iconClick}
          icon={<Icon type='icon-daoru'/>}
          dropMenu={[
                    {
                      key: 'PDManer-history',
                      name: FormatMessage.string({id: 'toolbar.importPDManHistory'}),
                      children: [
                        { key: 'pdman', name: FormatMessage.string({id: 'toolbar.importPDMan'}) },
                        { key: 'chiner', name: FormatMessage.string({id: 'toolbar.importCHNR'}) },
                        { key: 'PDManer', name: FormatMessage.string({id: 'toolbar.importPDManer'}) }],
                    },
                    {
                      key: 'other-model',
                      name: FormatMessage.string({id: 'toolbar.importOtherModelFile'}),
                      children: [
                          { key: 'powerdesigner', name: FormatMessage.string({id: 'toolbar.importPowerDesigner'}) },
                          { key: 'excel', name: FormatMessage.string({id: 'toolbar.importExcel'}) },
                      ],
                    },
                    {
                      key: 'db-data',
                      name: FormatMessage.string({id: 'toolbar.importDbData'}),
                      children: [
                        { key: 'db', name: FormatMessage.string({id: 'toolbar.importDb'}) },
                        { key: 'importDDL', name: FormatMessage.string({id: 'toolbar.importDDL'}) },
                     ],
                    },
                    {
                      key: 'sys-config',
                      name: FormatMessage.string({id: 'toolbar.importJsonConfig'}),
                      children: [
                        {
                          key: 'domains',
                          name: FormatMessage.string({id: 'toolbar.importDomains'}),
                        },
                        {
                          key: 'appCodes',
                          name: FormatMessage.string({id: 'toolbar.importAppCodes'}),
                        },
                        { key: 'importConfig', name: FormatMessage.string({id: 'toolbar.importConfig'}) },
                      ],
                    },
                    {
                      key: 'sys-data',
                      name: FormatMessage.string({id: 'toolbar.importJsonData'}),
                      children: [
                        { key: 'importDicts', name: FormatMessage.string({id: 'toolbar.importDicts'}) },
                      ],
                    },
               ]}
           />
        <GroupIcon
          onClick={iconClick}
          title={FormatMessage.string({id: 'toolbar.export'})}
          icon={<Icon type='icon-daochu'/>}
          dropMenu={[
                   {
                     key: 'export-file',
                     name: FormatMessage.string({id: 'toolbar.exportFile'}),
                     children: [
                       {key: 'word', name: FormatMessage.string({id: 'toolbar.exportWord'})},
                       {key: 'html', name: FormatMessage.string({id: 'toolbar.exportHtml'})},
                       {key: 'export-excel', name: FormatMessage.string({id: 'toolbar.exportExcel'})},
                     ],
                   },
                    {
                      key: 'export-SQL',
                      name: FormatMessage.string({id: 'toolbar.exportSQL'}),
                      children: [
                        {key: 'sql', name: FormatMessage.string({id: 'toolbar.exportSql'})},
                        {key: 'dict', name: FormatMessage.string({id: 'toolbar.exportDict'})},
                      ],
                    },
                    {
                      key: 'export-Canvas',
                      name: FormatMessage.string({id: 'toolbar.exportCanvas'}),
                      children: [
                        {
                          key: 'png',
                          name: FormatMessage.string({id: 'toolbar.exportImgPng'}),
                          disable: checkDisable(),
                        },
                        {
                          key: 'svg',
                          name: FormatMessage.string({id: 'toolbar.exportImgSvg'}),
                          disable: checkDisable(),
                        },
                      ],
                    },
                   // {key: 'markdown', name: FormatMessage.string({id: 'toolbar.exportMarkdown'})},
                  {
                    key: 'export-config',
                    name: FormatMessage.string({id: 'toolbar.exportJsonConfig'}),
                    children: [
                      {
                        key: 'exportDomains',
                        name: FormatMessage.string({id: 'toolbar.exportDomains'}),
                      },
                      {
                        key: 'exportAppCodes',
                        name: FormatMessage.string({id: 'toolbar.exportAppCodes'}),
                      },
                      { key: 'exportConfig', name: FormatMessage.string({id: 'toolbar.exportConfig'}) },
                    ],
                  },
            {
              key: 'export-data',
              name: FormatMessage.string({id: 'toolbar.exportJsonData'}),
              children: [
                { key: 'exportDicts', name: FormatMessage.string({id: 'toolbar.exportDicts'}) },
              ],
            },
               ]}
           />
        <GroupIcon title={FormatMessage.string({id: 'toolbar.setting'})} icon='icon-shezhi' onClick={() => openModal('config')}/>
        <GroupIcon className={`${currentPrefix}-head-db`} title={FormatMessage.string({id: 'toolbar.dbConnect'})} icon='fa-database' onClick={() => openModal('dbConnect')}/>
        <GroupIcon className={`${currentPrefix}-head-db`} title={FormatMessage.string({id: 'toolbar.history'})} icon='fa-history' onClick={e => iconClick(e, 'history')}/>
      </GroupIconGroup>
    </>}
    <div className={`${currentPrefix}-head-search`}>
      <SearchSuggest
        jumpPosition={jumpPosition}
        jumpDetail={jumpDetail}
        placeholder={FormatMessage.string({id: 'toolbar.search'})}
        dataSource={dataSource}
      />
    </div>
  </div>;
}));
