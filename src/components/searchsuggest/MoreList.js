import React, {useRef, useState} from 'react';
import SearchInput from '../searchinput';
import FormatMessage from '../formatmessage';

export default React.memo(({getItemList, filterData, currentPrefix,
                             allData, getFilterData, placeholder, search}) => {
  const [data, setData] = useState(filterData);
  const value = useRef(search);
  const onChange = (e) => {
    value.current = e.target.value;
    if (value.current) {
      setData(allData.map((d) => {
        return {
          ...d,
          data: getFilterData(d.data, value.current),
        };
      }).filter(d => d.data.length > 0));
    } else {
      setData([]);
    }
  };
  return <div className={`${currentPrefix}-search-suggest-morelist`}>
    <div className={`${currentPrefix}-search-suggest-morelist-search`}>
      <SearchInput placeholder={placeholder} onChange={onChange} defaultValue={search}/>
    </div>
    {
      data.length > 0 ? getItemList(data, data, value.current) :
      <div className={`${currentPrefix}-search-suggest-empty`}>
        <FormatMessage id='components.searchSuggest.empty'/>
      </div>
    }
  </div>;
});
