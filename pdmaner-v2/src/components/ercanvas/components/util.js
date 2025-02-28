import {hex2Rgba} from '../../../lib/color';

export const renderer = {
  heading(text, level, raw, slugger) {
    if (this.options.headerIds) {
      return `<h${
         level
         } style="margin: 5px" id="${
         this.options.headerPrefix
         }${slugger.slug(raw)
         }">${
         text
         }</h${
         level
         }>\n`;
    }
    // ignore IDs
    return `<h${level} style="margin: 5px">${text}</h${level}>\n`;
  },
  paragraph(text) {
    return `<p style="margin: 5px">${text}</p>`;
  },
  hr(){
    return '<hr style="margin: 0;border-style: solid;color: #F2F5F6" size="1px"/>';
  },
  list(body, ordered, start) {
    const type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (` start="${start}"`) : '';
    return `<${type}${startatt} style="text-align: left;margin: 0px 0px 0px 20px;padding: 0px;line-height: 10px;${ordered ? '' : 'list-style: circle'}">\n${body}</${type}>\n`;
  },
};

// 创建右键菜单
export const createContentMenu = (event, menus, cb) => {
    let menuContainer = document.querySelector('.ercanvas-menus');
    if (menuContainer) {
        menuContainer.parentElement.removeChild(menuContainer);
    }
    menuContainer = document.createElement('div');
    menuContainer.setAttribute('class', 'ercanvas-menus');
    document.body.appendChild(menuContainer);
    menuContainer.onblur = () => {
        menuContainer.onblur = null;
        menuContainer.onclick = null;
        menuContainer.style.display = 'none';
    };
    menuContainer.onclick = () => {
        menuContainer.blur();
    };
    menuContainer.setAttribute('tabindex', '0');
    menuContainer.style.left = `${event.clientX + 1}px`;
    menuContainer.style.top = `${event.clientY + 1}px`;
    const ul = document.createElement('ul');
    menus.forEach((m, i) => {
        const li = document.createElement('li');
        li.onclick = () => {
            cb && cb(i);
        };
        li.innerText = m.name;
        ul.appendChild(li);
    });
    menuContainer.appendChild(ul);
    setTimeout(() => {
        menuContainer.focus();
    });
};

export const getChildrenCell = (n, cells, check = [n.id]) => {
    // 避免极端情况下的死循环
    if (n.prop('children')?.length > 0) {
        return n.prop('children').reduce((a, b) => {
            const child = cells.find(c => c.id === b);
            if (child && !check.includes(child.id)) {
                return a.concat(child)
                    .concat(getChildrenCell(child, cells, check.concat(child.id)));
            }
            return a;
        }, []);
    }
    return [];
};

export const refactorCopyData = (cells, graph) => {
    const cloneData = graph.cloneCells(cells);
    return Object.keys(cloneData).reduce((p, n) => {
        return p.concat(cloneData[n]);
    }, []);
};

export const getChildrenId = (n, nodes) => {
    const children = n.prop('children') || [];
    if (children.length === 0) {
        return [];
    }
    return children.reduce((a, b) => {
        const bNode = nodes.find(cNode => cNode.id === b);
        return a.concat(bNode ? getChildrenId(bNode, nodes).concat(bNode.id) : []);
    }, children);
};


export const calcColor = (color, opacity = 0.05) => {
    if (color.startsWith('#')) {
        return hex2Rgba(color, opacity);
    }
    const tempColor = color.replace(/rgb?\(/, '')
        .replace(/\)/, '')
        .replace(/[\s+]/g, '')
        .split(',');
    return `rgba(${tempColor.join(',')}, ${opacity})`;
};
