import React, {useState, useRef, useEffect, forwardRef, useImperativeHandle} from 'react';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import {addDomResize, removeDomResize} from '../../lib/listener';

export default React.memo(forwardRef(({children, onScroll, containerHeight,
                               itemHeight, prefix,
                               offsetHeight}, ref) => {
    const id = useRef(Math.uuid());
    const lengthRef = useRef(0);
    const indexRef = useRef(0);
    const [top, setTop] = useState(0);
    const scrollRef = useRef(null);
    const scrollTimer = useRef(null);
    const isScroll = useRef(false);
    const scrollData = useRef(0);
    const scrollTopRef = useRef(0);
    const scrollTopTypeRef = useRef('');
    const topRef = useRef(0);
    topRef.current = top;

    const onScrollEnd = () => {
        if(topRef.current !== scrollRef.current.scrollTop && scrollTopTypeRef.current === 'bottom') {
            scrollRef.current.scrollTop = topRef.current;
        }
    };
    const checkScroll = () => {
        isScroll.current = true;
        scrollData.current = scrollRef.current.scrollTop;
        scrollTimer.current && clearTimeout(scrollTimer.current);
        scrollTimer.current = setTimeout(() => {
            if (scrollRef.current.scrollTop === scrollData.current) {
                isScroll.current = false;
                clearTimeout(scrollTimer.current);
                scrollTimer.current = null;
                onScrollEnd();
            } else {
                scrollData.current = scrollRef.current.scrollTop;
            }
        }, 100);
    };
    const _onScroll = () => {
        checkScroll();
        requestAnimationFrame(() => {
            const sTop = scrollRef.current.scrollTop;
            if(sTop === 0) {
                onScroll(0, lengthRef.current);
                setTop(0);
            } else {
                let count =  Math.floor(sTop / itemHeight);
                if (indexRef.current !== count) {
                    indexRef.current = count;
                    onScroll(count, lengthRef.current);
                    setTop(sTop);
                }
            }
            if (scrollTopRef.current <= sTop) {
                scrollTopTypeRef.current = 'top';
            } else {
                scrollTopTypeRef.current = 'bottom';
            }
            scrollTopRef.current = sTop;
        });
    };
    const updateLength = () => {
        if(scrollRef.current) {
            if (scrollRef.current.clientHeight === 0) {
                setTimeout(() => {
                    removeDomResize(scrollRef.current, id);
                    addDomResize(scrollRef.current, id, () => {
                        updateLength();
                    });
                });
            } else {
                const length = Math.ceil((scrollRef.current.clientHeight - 25) / itemHeight);
                const sTop = scrollRef.current.scrollTop;
                lengthRef.current = length;
                onScroll(sTop === 0 ? 0 : indexRef.current, lengthRef.current);
            }
        }
    };
    useEffect(() => {
        updateLength();
    }, [containerHeight]);
    useEffect(() => {
        if (scrollRef.current) {
            addDomResize(scrollRef.current, id, () => {
                updateLength();
            });
            return () => {
                removeDomResize(scrollRef.current, id);
            };
        }
        return () => {};
    }, []);
    useImperativeHandle(ref, () => {
        return {
            scroll: (data) => {
                scrollRef.current.scrollTop += data;
            },
            scrollTop: (data) => {
                scrollRef.current.scrollTop = data;
            },
        };
    }, []);
    const currentPrefix = getPrefix(prefix);
    return <div style={{height: `calc(100% - ${offsetHeight}px)`}}>
      <div ref={scrollRef} className={`${currentPrefix}-virtuallist-scoll`} onScroll={_onScroll}>
        <div style={{height: containerHeight}} className={`${currentPrefix}-virtuallist-container`}>
          <div className={`${currentPrefix}-virtuallist-container-children`} style={{top: top}}>
            {children}
          </div>
        </div>
      </div>
    </div>;
}));
