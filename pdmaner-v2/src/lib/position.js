
// 组装节点数据
const pickCellData = (cells) => {
  return cells.filter(c => c.shape !== 'erdRelation').map(c => {
      return {
          id: c.id,
          w: c.store.data.size.width,
          h: c.store.data.size.height,
          x: c.store.data.position.x,
          y: c.store.data.position.y,
      }
  })
}
// 计算左对齐
export const alignLeft = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const minCell = tempCell.sort((a, b) => a.x - b.x)[0];
    return tempCell.map(c => ({...c, x: minCell.x}))
}

// 计算水平居中
export const horizontalCenter = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const minX = Math.min(...tempCell.map(c => c.x));
    const maxX = Math.max(...tempCell.map(c => c.x + c.w));
    const center = (maxX - minX) / 2 + minX;
    return tempCell.map(c => ({...c, x: center - c.w / 2}))
}

// 右对齐
export const alignRight = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const maxCell = tempCell.sort((a, b) => (b.x + b.w) - (a.x + a.w))[0];
    return tempCell.map(c => ({...c, x: (maxCell.x + maxCell.w) - c.w}))
}

// 顶部对齐
export const alignTop = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const minCell = tempCell.sort((a, b) => a.y - b.y)[0];
    return tempCell.map(c => ({...c, y: minCell.y}))
}

// 垂直居中
export const verticalCenter = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const minY = Math.min(...tempCell.map(c => c.y));
    const maxY = Math.max(...tempCell.map(c => c.y + c.h));
    const center = (maxY - minY) / 2 + minY;
    return tempCell.map(c => ({...c, y: center - c.h / 2}))
}

// 底部对齐
export const alignBottom = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const maxCell = tempCell.sort((a, b) => (b.y + b.h) - (a.y + a.h))[0];
    return tempCell.map(c => ({...c, y: maxCell.y + maxCell.h - c.h}))
}

// 水平分布
export const alignRow = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const tempCellCenter = tempCell.map(c => c.y + c.h / 2);
    let centerY;
    if(tempCellCenter.every(c => c === tempCellCenter[0])) {
        centerY = tempCellCenter[0];
    } else {
        const maxY = Math.max(...tempCell.map(c => c.y + c.h));
        centerY = maxY / 2;
    }
    const maxX = Math.max(...tempCell.map(c => c.x + c.w));
    const minX = Math.min(...tempCell.map(c => c.x));
    const allCellWidth = tempCell.reduce((a, b) => a + b.w, 0);
    const minOffset = 25;
    const offset = (maxX - minX - allCellWidth) / ((tempCell.length - 1) || 1);
    return tempCell
        .sort((a, b) => a.x - b.x)
        .reduce((a, b, i) => {
            return a.concat({
                ...b,
                y: centerY - b.h / 2,
                x: (i === 0 ? b.x : a[i-1].x + a[i-1].w + (offset < minOffset ? minOffset : offset)),
            })
        }, [])
}

// 垂直分布
export const alignColumn = (allCell, needPicker = true) => {
    const tempCell = needPicker ? pickCellData(allCell) : allCell;
    const tempCellCenter = tempCell.map(c => c.x + c.w / 2);
    let centerX;
    if(tempCellCenter.every(c => c === tempCellCenter[0])) {
        centerX = tempCellCenter[0];
    } else {
        const maxX = Math.max(...tempCell.map(c => c.x + c.w));
        centerX = maxX / 2;
    }
    const minY = Math.min(...tempCell.map(c => c.y));
    const maxY = Math.max(...tempCell.map(c => c.y + c.h));
    const minOffset = 25;
    const offset = (maxY - minY - tempCell.reduce((a, b) => a + b.h, 0)) / ((tempCell.length - 1) || 1);
    return tempCell
        .sort((a, b) => a.y - b.y)
        .reduce((a, b, i) => {
            return a.concat({
                ...b,
                x: centerX - b.w / 2,
                y: (i === 0 ? b.y : a[i-1].y + a[i-1].h + (offset < minOffset ? minOffset : offset)),
            })
        }, [])
}

export const checkAlignEnable = (cells) => {
    return cells.filter(c => c.shape !== 'erdRelation').length > 1;
}

