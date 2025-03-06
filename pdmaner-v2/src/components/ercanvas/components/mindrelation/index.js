import { Graph, Path } from '@antv/x6';

// 连接器
Graph.registerConnector(
    'mindmap',
    (sourcePoint, targetPoint, routerPoints, options, edgeView) => {
        let e, s;
        const layout = edgeView.sourceView.cell.prop('layout');
        if (layout === 'vertical' || layout === 'bottom') {
            if (sourcePoint.y < targetPoint.y) {
                e = targetPoint;
                s = sourcePoint;
            } else {
                e = sourcePoint;
                s = targetPoint;
            }
            const offset = 4;
            const deltaY = Math.abs(e.y - s.y);
            const control = Math.floor((deltaY / 3) * 2);

            const v1 = { x: s.x, y: s.y + offset + control };
            const v2 = { x: e.x, y: e.y - offset - control };

            return Path.normalize(
                `M ${s.x} ${s.y}
       L ${s.x} ${s.y + offset}
       C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${e.x} ${e.y - offset}
       L ${e.x} ${e.y}
      `,
            );
        } else {
            const midX = sourcePoint.x + (sourcePoint.x < targetPoint.x ? 10 : -10);
            const midY = sourcePoint.y;
            const ctrX = (targetPoint.x - midX) / 5 + midX;
            const ctrY = targetPoint.y;
            const pathData = `
             M ${sourcePoint.x} ${sourcePoint.y}
             L ${midX} ${midY}
             Q ${ctrX} ${ctrY} ${targetPoint.x} ${targetPoint.y}
            `;
            return Path.normalize(pathData);
        }
    },
    true,
);


Graph.registerEdge('mind-edge', {
    inherit: 'edge',
    connector: {
        name: 'mindmap',
    },
    propHooks(metadata) {
        const { fillColor, ...others } = metadata;
        if (fillColor) {
            return {
                ...metadata,
                attrs: {
                    line: {
                        stroke: fillColor,
                    },
                },
            };
        }
        return others;
    },
    attrs: {
        line: {
            targetMarker: '',
            strokeWidth: 1,
            stroke: '#ACDAFC',
        },
    },
    zIndex: 3,
});

Graph.registerEdge('mind-edge-img', {
    inherit: 'mind-edge',
    attrs: {
        line: {
        },
    },
});
