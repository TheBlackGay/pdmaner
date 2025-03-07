import React, { useState } from 'react';
import { Button, Modal, Checkbox } from '../../components';
import FormatMessage from '../formatmessage';
import { getPrefix } from '../../lib/prefixUtil';

/**
 * 看板娘配置面板
 */
const Live2dConfig = React.memo(({ prefix, visible, onOk, onClose, defaultConfig }) => {
  const currentPrefix = getPrefix(prefix);
  const [config, setConfig] = useState(defaultConfig || {});
  
  const handleChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSubmit = () => {
    onOk && onOk(config);
    onClose && onClose();
  };
  
  return (
    <Modal
      visible={visible}
      title='看板娘设置'
      onOk={handleSubmit}
      onCancel={onClose}
    >
      <div className={`${currentPrefix}-live2d-config`}>
        <div className={`${currentPrefix}-live2d-config-item`}>
          <Checkbox
            checked={config.canCloseLive2d}
            onChange={e => handleChange('canCloseLive2d', e.target.checked)}
          >
            允许关闭看板娘
          </Checkbox>
        </div>
        
        <div className={`${currentPrefix}-live2d-config-item`}>
          <Checkbox
            checked={config.canSwitchModel}
            onChange={e => handleChange('canSwitchModel', e.target.checked)}
          >
            允许切换模型
          </Checkbox>
        </div>
        
        <div className={`${currentPrefix}-live2d-config-item`}>
          <Checkbox
            checked={config.canSwitchTextures}
            onChange={e => handleChange('canSwitchTextures', e.target.checked)}
          >
            允许切换衣服
          </Checkbox>
        </div>
        
        <div className={`${currentPrefix}-live2d-config-footer`}>
          <Button onClick={onClose}>
            <FormatMessage id='button.cancel'/>
          </Button>
          <Button onClick={handleSubmit} type='primary'>
            <FormatMessage id='button.ok'/>
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default Live2dConfig; 