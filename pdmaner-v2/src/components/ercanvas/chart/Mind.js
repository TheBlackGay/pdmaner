import Hierarchy from '@antv/hierarchy';
import {FormatMessage, Message} from 'components';
import {edgeNodeAddTool} from 'components/ercanvas/components/tool';
import { tree2array } from '../../../lib/tree';
import {getChildrenCell, getChildrenId, refactorCopyData} from '../components/util';
import {openUrl} from '../../../lib/json2code_util';
import {separator} from '../../../../profile';
import {getCache} from '../../../lib/cache';

export default class Mind {
    constructor({graph, dnd, isView, dataChange, updateDataSource, getDataSource,
                    historyChange, openDict}) {
        this.graph = graph;
        this.dnd = dnd;
        this.isView = isView;
        this.dataChange = dataChange;
        this.updateDataSource = updateDataSource;
        this.getDataSource = getDataSource;
        this.historyChange = historyChange;
        this.openDict = openDict;
    }
    filterMindCell = (cells) => {
        // 分支主题 中心主题 连接线
        const erCells =
            ['mind-topic-branch', 'mind-topic', 'mind-edge'];
        return ([].concat(cells)).filter((c) => {
            return erCells.includes(c.shape);
        });
    }
    isMindCell = (cell) => {
        return this.filterMindCell(cell).length > 0;
    }
    getRoot = (node, nodes) => {
        if (node.shape === 'mind-topic') {
            return node;
        }
        return nodes.filter(n => n.shape === 'mind-topic')
            .find((n) => {
                return getChildrenId(n, nodes).includes(node.id);
            });
    }
    updateTree = (node, v, filterCells = []) => {
        const nodes = this.graph.getNodes()
            .filter(n => filterCells.findIndex(c => c.id === n.id) < 0);
        const node2Tree = (root) => {
            const getChildrenNode = (children) => {
                return children.map((c) => {
                    const cNode = nodes.find(n => n.id === c);
                    if (!cNode) {
                        return null;
                    }
                    return {
                        id: cNode.id,
                        ...cNode.size(),
                        children: getChildrenNode(cNode.prop('children') || []),
                    };
                }).filter(c => !!c);
            };
            return {
                id: root.id,
                ...root.size(),
                children: getChildrenNode(root.prop('children') || []),
            };
        };
        let root;
        // 获取根节点位置
        if (node.shape === 'mind-topic') {
            root = node;
        } else {
            root = this.getRoot(node, nodes);
        }
        // 生成新的节点树
        //console.log(node2Tree(root));
        const getDirection = () => {
            switch (v) {
                case 'vertical': return 'V';
                case 'horizontal': return 'H';
                case 'left': return 'RL';
                case 'right': return 'LR';
                case 'bottom': return 'TB';
                default: return 'H';
            }
        };
        return {data: Hierarchy.compactBox(
            node2Tree(root),
            {
                direction: getDirection(v),
                getHeight(d) {
                    return d.height;
                },
                getWidth(d) {
                    return d.width;
                },
                getHGap() {
                    return 40;
                },
                getVGap() {
                    return 20;
                },
            }),
            root};
    };
    updateLayout = (node, v, filterCells) => {
        const {data,root} = this.updateTree(node, v, filterCells);
        const result = tree2array([data]);
        const currentNode = result[0];
        const prePosition = root.position();
        const offset = {x: currentNode.x - prePosition.x, y: currentNode.y - prePosition.y};
        const nodes = this.graph.getNodes();
        result.forEach((n) => {
            const updateNode = nodes.find(c => c.id === n.id);
            // 更新节点信息
            updateNode?.position(n.x - offset.x, n.y - offset.y);
            updateNode?.prop('layout', v);
        });
        const edges = this.graph.getEdges();
        const mindEdge = edges
            .filter(n => n.shape === 'mind-edge' &&
                result.findIndex(r => (r.id === n.target.cell) || (r.id === n.source.cell)) >= 0);
        mindEdge.forEach((e) => {
            // 更新连线信息
            const source = e.getSourceCell();
            const target = e.getTargetCell();
            if (node.prop('layout') === 'vertical' || node.prop('layout') === 'bottom') {
                const sY = source.position().y;
                const tY = target.position().y;
                if (sY > tY) {
                    e.prop('source/port', 'top');
                    e.prop('target/port', 'bottom');
                } else {
                    e.prop('source/port', 'bottom');
                    e.prop('target/port', 'top');
                }
            } else {
                const sX = source.position().x;
                const tX = target.position().x;
                if (sX < tX) {
                    e.prop('source/port', 'right');
                    e.prop('target/port', 'left');
                } else {
                    e.prop('source/port', 'left');
                    e.prop('target/port', 'right');
                }
            }
            e.toFront();
        });
        setTimeout(() => {
            result.forEach((n) => {
                const updateNode = nodes.find(c => c.id === n.id);
                updateNode.toFront();
            });
        });
    };
    expand = (n) => {
        this.graph.batchUpdate('expand', () => {
            const currentExpand = n.prop('isExpand') !== false;
            const children = getChildrenCell(n, this.graph.getNodes());
            n.prop('isExpand', !currentExpand);
            children.filter(c => c.isNode()).forEach((c) => {
                c.toggleVisible(!currentExpand);
            });
            setTimeout(() => {
                children.filter(c => c.isNode()).forEach((c) => {
                    c.toFront();
                });
            });
        });
    };
    id2Nodes = (ids) => {
        return this.graph.getNodes().filter(node => ids.includes(node.id));
    };
    nodeTextClick = (node) => {
        const link = JSON.parse(node.getProp('link') || '{}');
        if (link.type) {
            if (link.type === 'externally') {
                openUrl(link.value);
            } else {
                const iconMap = {
                    entities: 'fa-table',
                    views: 'icon-shitu',
                    diagrams: 'icon-guanxitu',
                    dicts: 'icon-shujuzidian',
                };
                const keyMap = {
                    entities: 'entity',
                    views: 'view',
                    diagrams: 'diagram',
                    dicts: 'dict',
                };
                // openDict(data.id, 'dict', null, 'dict.svg');
                const dataSource = this.getDataSource();
                const ids = link.value?.split(separator);
                let currentKey = '';
                let parentKey = null;
                if (ids.length > 1) {
                    currentKey = ids[1];
                    parentKey = ids[0];
                } else {
                    currentKey = link.value;
                }
                const currenTab = Object.keys(iconMap).find((i) => {
                    return dataSource[i].some(d => d.id === currentKey);
                });
                if (currenTab) {
                    setTimeout(() => {
                        this.openDict(currentKey, keyMap[currenTab], parentKey, iconMap[currenTab]);
                    });
                } else {
                    Message.error({title: `${FormatMessage.string({id: 'canvas.node.invalidLink'})}`});
                }
            }
        }
        //console.log(node);
    }
    addChildNode = (node, autoSelected) => {
        // 创建临时节点
        const newNode = {
            id: Math.uuid(),
            width: 80,
            height: 40,
        };
        this.graph.batchUpdate('addChildNode', () => {
            // 增加子节点
            const addNode = this.graph.addNode({
                zIndex: 3,
                id: newNode.id,
                shape: 'mind-topic-branch',
                width: newNode.width,
                height: newNode.height,
                label: FormatMessage.string({id: 'canvas.node.topicBranch'}),
                fillColor: '#DDE5FF',
                layout: node.prop('layout'),
                expand: this.expand,
                nodeClickText: this.nodeTextClick,
            });
            if (autoSelected) {
                this.graph.resetSelection(addNode);
            }
            // 增加连接线
            this.graph.addEdge({
                id: Math.uuid(),
                shape: 'mind-edge',
                source: {
                    cell: node.id,
                },
                target: {
                    cell: newNode.id,
                },
            });
            // 更新当前界节点的子节点数据
            node.setChildren(this.id2Nodes((node.prop('children') || []).concat(newNode.id)), {needUndo: true});
            // 重新生成新的布局
            this.updateLayout(node, node.prop('layout'));
        });
    };
    createTopicNode = (e, isRoot) => {
        if (isRoot) {
            const node =  this.graph.createNode({
                shape: 'mind-topic',
                label: FormatMessage.string({id: 'canvas.node.topic'}),
                width: 160,
                height: 50,
                fillColor: '#DDE5FF',
                layout: 'vertical',
                expand: this.expand,
                nodeClickText: this.nodeTextClick,
            });
            this.dnd.start(node, e.nativeEvent);
        } else {
            const selectedNodes = this.graph.getSelectedCells()
                .filter(item => item.isNode() && item.prop('shape').includes('mind'));
            if (selectedNodes.length) {
                const node = selectedNodes[0];
                this.addChildNode(node);
            }
        }
    }
    selectionChanged = (added, removed) => {
        this.filterMindCell(added).forEach((c) => {
            if (c.isNode()) {
                c.attr('body', {
                    stroke: 'red',
                    strokeWidth: 3,
                }, { ignoreHistory : true});
            } else {
                c.attr('line/stroke', '#1890FF', { ignoreHistory : true});
                c.attr('line/strokeWidth', 2, { ignoreHistory : true});
            }
        });
        this.filterMindCell(removed).forEach((c) => {
            if (c.isNode()) {
                c.attr('body', {
                    stroke: '#DFE3EB',
                    strokeWidth: 1,
                }, { ignoreHistory : true});
                c.setProp('editable', false, { ignoreHistory : true });
            } else {
                c.attr('line/stroke', c.getProp('fillColor')
                    || '#ACDAFC', { ignoreHistory : true});
                c.attr('line/strokeWidth', 1, { ignoreHistory : true});
            }
        });
        // 分组和子节点需要互斥选中(脑图和关系图都需要)
        const addChildren = this.filterMindCell(added)
            .reduce((p, n) => p.concat(getChildrenCell(n, this.graph.getCells())), [])
            .map(n => n.id);
        this.filterMindCell(added).filter(n => !addChildren.includes(n.id)).forEach((node) => {
            const childrenIds = getChildrenCell(node, this.graph.getCells()).map(n => n.id);
            const children = this.graph.getSelectedCells()
                .filter(c => childrenIds.includes(c.id));
            const parent = this.graph.getSelectedCells()
                .filter(c => getChildrenCell(c, this.graph.getCells()).map(n => n.id)
                    .includes(node.id));
            const unselectCells = children.concat(parent);
            if (unselectCells.length > 0) {
                this.graph.unselect(unselectCells);
            }
        });
    }
    interacting = ({cell}) => {
        if (this.isMindCell(cell)) {
            return (cell.shape === 'mind-topic' || cell.shape === 'mind-topic-branch') && !cell.getProp('editable');
        }
        return true;
    }
    render = (data) => {
        return this.filterMindCell((data?.canvasData?.cells || []).map((cell) => {
            return {
                ...cell,
                expand: this.expand,
                nodeClickText: this.nodeTextClick,
            };
        }));
    }
    nodeDbClick = (e, cell) => {
        if (this.isMindCell(cell)) {
            if (e.target.getAttribute('class')?.includes('chiner-er-editnode-mind')) {
                this.graph.unselect(cell);
            } else if (!this.isView && !cell.getProp('isLock')) {
                    cell.setProp('editable', true, {ignoreHistory: true});
                }
        }
    }
    nodeSelected = (node) => {
        if (this.isMindCell(node)) {
            node.addTools([{
                name: 'showSizeTool',
            }]);
        }
    }
    resizingEnabled = (node) => {
        return this.isMindCell(node);
    }
    findParentNode = (node) => {
        return this.graph.getNodes().find((n) => {
            console.log(n);
            return (n.prop('children') || []).includes(node.id);
        });
    }
    findNodeNext = (node) => {
        const parentNode = this.findParentNode(node);
        const allNodes = this.graph.getNodes();
        if (parentNode) {
            const childrenIds = parentNode.prop('children');
            const siblingNodes = allNodes.filter(c => childrenIds.includes(c.id));
            const index = siblingNodes.findIndex(c => c.id === node.id);
            const pre = index - 1;
            const next = index + 1;
            return siblingNodes[pre] || siblingNodes[next] || parentNode;
        }
        return node;
    }
    enter = () => {
        this.graph.batchUpdate('enter', () => {
            const cells = this.graph.getSelectedCells();
            const enterCell = cells.slice(-1)[0];
            if (enterCell && this.isMindCell(enterCell) && enterCell.isNode()) {
                const parentNode = this.findParentNode(enterCell);
                if (parentNode) {
                    this.addChildNode(parentNode, true);
                }
            }
        });
    }
    delete = () => {
        this.graph.batchUpdate('delete', () => {
            const cells = this.graph.getSelectedCells();
            if (this.filterMindCell(cells).length) {
                const deleteCells = cells.filter(c => !c.getProp('isLock') && c.isNode() && !c.getProp('editable'));
                if (deleteCells.length === 1) {
                    const node = this.findNodeNext(deleteCells[0]);
                    if (node !== deleteCells[0]) {
                        this.graph.select(node);
                    }
                }
                const roots = [];
                const deleteNodes =  deleteCells.filter(c => c.isNode());
                const allCells = this.graph.getNodes();
                const childrenCells = [];
                deleteNodes.forEach((c) => {
                    c.removeTools();
                    this.graph.unselect(c);
                    if (c.prop('children')?.length > 0){
                        childrenCells.push(...getChildrenCell(c, this.graph.getCells()));
                    }
                    const root = this.getRoot(c, allCells);
                    if (root && c.id !== root.id && roots.findIndex(r => r.id === root.id) < 0) {
                        roots.push(root);
                    }
                });
                // 找到每个删除节点的跟节点
                roots.forEach((r) => {
                    this.updateLayout(r, r.prop('layout'), deleteNodes);
                });
                const allDeleteCells = deleteCells.concat(childrenCells);
                const allNodes = this.graph.getNodes();
                allDeleteCells.forEach((c) => {
                    if (c.isNode()) {
                        if (c.prop('children')?.length > 0){
                            c.setChildren([], {needUndo: true});
                        }
                        const parent = allNodes.find(no => no.prop('children')?.includes(c.id));
                        if (parent) {
                            parent.setChildren(parent.getChildren()
                                .filter(child => child.id !== c.id), {needUndo: true});
                        }
                    }
                });
                const allEdges = this.graph.getEdges().filter((e) => {
                    const targetNodeIndex = allDeleteCells.findIndex(n => n.id === e.target.cell);
                    const sourceNodeIndex = allDeleteCells.findIndex(n => n.id === e.source.cell);
                    return targetNodeIndex > -1 || sourceNodeIndex > -1;
                });
                this.graph.removeCells(allEdges.concat(allDeleteCells));
            }
        });
    }
    edgeOver = (edge, graph, id, isScroll) => {
        if (this.isMindCell(edge)) {
            if (!isScroll && graph.isSelected(edge)) {
                edgeNodeAddTool(edge, graph, id, () => {
                    this.dataChange && this.dataChange(this.graph.toJSON({diff: true}));
                }, this.getDataSource, this.updateDataSource, {
                    updateLayout: this.updateLayout,
                });
            }
        }
    }
    nodeMouseEnter = (node, graph, id, isScroll) => {
        if (this.isMindCell(node)) {
            if (!isScroll && graph.isSelected(node)) {
                edgeNodeAddTool(node, graph, id, () => {
                    this.dataChange && this.dataChange(this.graph.toJSON({diff: true}));
                }, this.getDataSource, this.updateDataSource, {
                    updateLayout: this.updateLayout,
                });
            }
        }
    };
    cellClick = (cell, graph, id, e) => {
        if (this.isMindCell(cell)) {
            if (e.target.getAttribute('class')?.includes('chiner-er-editnode-mind')) {
                this.graph.unselect(cell);
            } else {
                edgeNodeAddTool(cell, graph, id, () => {
                    this.dataChange && this.dataChange(this.graph.toJSON({diff: true}));
                }, this.getDataSource, this.updateDataSource, {
                    updateLayout: this.updateLayout,
                });
            }
        }
    };
    nodeMoved = (cell, graph, id) => {
        if (this.isMindCell(cell) && graph.isSelected(cell)) {
            edgeNodeAddTool(cell, graph, id, () => {
                this.dataChange && this.dataChange(this.graph.toJSON({diff: true}));
            }, this.getDataSource, this.updateDataSource, {
                updateLayout: this.updateLayout,
            });
        }
    };
    nodeResized = (node) => {
        if (this.isMindCell(node)) {
            this.updateLayout(node, node.prop('layout'));
        }
    }
    nodeEmbed = (node) => {
        const selectedCells = this.graph.getSelectedCells();
        const nodes = this.filterMindCell(this.graph.isSelected(node) ? selectedCells : [node]);
        this.embedData = nodes.map((n) => {
            return {
                shape: n.shape,
                id: n.id,
                parent: this.graph.getNodes()
                    .find(no => no.prop('children')?.includes(n.id)),
                position: n.isNode() ? n.position() : {},
            };
        });
    };
    nodeEmbedded = (embeddedNode, currentParent) => {
        const nodes = this.embedData.filter(node => node.shape === 'mind-topic-branch');
        let needReplace = false;
        this.graph.batchUpdate('updateEmbed', () => {
            if (currentParent) {
                this.embedData.filter(node => node.shape === 'mind-topic').forEach((node) => {
                    const edges = this.graph.getEdges();
                    const currentNode = this.graph.getNodes().find(n => node.id === n.id);
                    const allCells = getChildrenCell(currentNode, this.graph.getNodes());
                    const mindEdge = edges
                        .filter(n => n.shape === 'mind-edge' &&
                            allCells
                                .findIndex(r => (r.id === n.target.cell)
                                    || (r.id === n.source.cell)) >= 0);
                    mindEdge.forEach((e) => {
                        e.toFront();
                    });
                    allCells.forEach((c) => {
                        c.toFront();
                    });
                    currentNode.toFront();
                });
            }
            if (nodes.length > 0) {
                const roots = [];
                const edges = this.graph.getEdges();
                const currentReset = [];
                const preReset = [];
                nodes.forEach((n) => {
                    const graphNodes = this.graph.getNodes();
                    const currentNode = graphNodes.find(node => node.id === n.id);
                    const previousParent = n.parent;
                    if (currentParent && (previousParent !== currentParent)) {
                        currentReset.push(n.id);
                        const index = preReset.findIndex(p => p.data.id === previousParent.id);
                        if (index < 0) {
                            preReset.push({
                                data: previousParent,
                                children: [n.id],
                            });
                        } else {
                            preReset[index].children = preReset[index].children.concat(n.id);
                        }
                    } else {
                        const currentPosition = currentNode?.position();
                        const offset = {
                            x: n.position.x - currentPosition.x,
                            y: n.position.y - currentPosition.y,
                        };
                        currentNode?.position(n.position.x, n.position.y);
                        if (currentNode) {
                            getChildrenCell(currentNode, this.graph.getNodes()).forEach((c) => {
                                const cPosition = c.position();
                                c.position(cPosition.x + offset.x, cPosition.y + offset.y);
                            });
                        }
                    }
                });
                const addRoot = (node) => {
                    if (!roots.some(r => r.id === node.id)) {
                        roots.push(node);
                    }
                };
                if (preReset.length > 0) {
                    preReset.forEach((p) => {
                        const previousParentChildren = p.data.prop('children');
                        p.data
                            .setChildren(this.id2Nodes(
                                [...new Set(previousParentChildren.concat(p.children))]));
                        p.data
                            .setChildren(this.id2Nodes([...new Set(previousParentChildren
                                .filter(id => !p.children.includes(id)))]), {needUndo: true});
                        const preRoot = this.getRoot(p.data, this.graph.getNodes());
                        addRoot(preRoot);
                    });
                }
                if (currentReset.length > 0) {
                    const currentParentChildren = currentParent.prop('children');
                    currentParent
                        .setChildren(this.id2Nodes([...new Set(currentParentChildren
                            .filter(id => !currentReset.includes(id)))]));
                    currentParent.setChildren(
                        this.id2Nodes([...new Set(currentParentChildren
                            .concat(currentReset))]), {needUndo: true});
                    edges.forEach((e) => {
                        if (currentReset.findIndex(id => id === e.target.cell) > -1) {
                            e.prop('source/cell', currentParent?.id);
                        }
                    });
                    const root = this.getRoot(currentParent, this.graph.getNodes());
                    addRoot(root);
                    needReplace = true;
                }
                this.graph.unselect(this.embedData);
                roots.forEach((r) => {
                    this.updateLayout(r, r.prop('layout'));
                });
            }
        });
        if (needReplace) {
            const position = this.graph.history.undoStack.splice(-2, 1);
            const length = this.graph.history.undoStack.length;
            this.graph.history.undoStack[length - 1] = []
                .concat(this.graph.history.undoStack[length - 1])
                .map((p) => {
                    if (p.data.key === 'position') {
                        const replacePosition = [].concat(position[0])
                            .find(r => r.data.key === 'position' && r.data.id === p.data.id);
                        return {
                            ...p,
                            data: {
                                ...p.data,
                                prev: {
                                    position: replacePosition?.data?.prev?.position
                                        || p.data.prev?.position,
                                },
                            },
                        };
                    }
                    return p;
                });
        } else if(nodes.length > 0) {
            this.graph.history.undoStack.splice(-2, 2);
            this.historyChange();
        }
    }
    findParent = (node) => {
        if (this.isMindCell(node)) {
            const bbox = node.getBBox();
            return this.graph.getNodes().filter((n) => {
                const shape = n.shape;
                // 暂不支持脑图置于分组
                if (node.shape !== 'mind-topic' &&
                    (shape === 'mind-topic-branch' || shape === 'mind-topic')) {
                    const targetBBox = n.getBBox();
                    return bbox.isIntersectWithRect(targetBBox);
                }
                return false;
            });
        }
        return false;
    }
    calcChildren = (cells) => {
        const nodes = cells.filter(c => c.isNode());
        const edges = cells.filter(c => c.isEdge());
        nodes.forEach((n) => {
            const currentEdge = edges.filter(e => e.source.cell === n.id);
            const ids = currentEdge.map(e => e.target.cell);
            n.setChildren(nodes.filter(node => ids.includes(node.id)));
        });
    };
    paste = () => {
        const jsonCells = getCache('x6.clipboard.cells', true);
        const copyCells = this.filterMindCell(jsonCells.map((c) => {
            if (c.position) {
                return this.graph.createNode(c);
            }
            return this.graph.createEdge(c);
        }));
        if (copyCells.length > 0) {
            this.graph.batchUpdate('paste', () => {
                const cells = refactorCopyData(copyCells, this.graph);
                this.calcChildren(cells);
                let tempCells = cells;
                const topic = cells.filter(c => c.shape === 'mind-topic');
                const addCells = () => {
                    this.graph.addNodes(tempCells.filter(c => c.isNode()));
                    this.graph.addEdges(tempCells.filter((c) => {
                        if (c.isEdge()) {
                            const source = tempCells.find(cell => cell.id === c.source.cell);
                            const target = tempCells.find(cell => cell.id === c.target.cell);
                            return source && target;
                        }
                        return false;
                    }));
                };
                const resetCell = (c) => {
                    c.setProp('nodeClickText', this.nodeTextClick);
                    c.setProp('expand', this.expand);
                    c.attr('body', {
                        stroke: '#DFE3EB',
                        strokeWidth: 1,
                    }, { ignoreHistory : true});
                    c.setProp('editable', false);
                    const children = c.getChildren();
                    c.setChildren([]);
                    c.setChildren(children, {needUndo: true});
                };
                if(topic.length > 0) {
                    const allChildren = topic.reduce((p, n) => {
                        return p.concat(getChildrenId(n, cells));
                    }, topic.map(t => t.id));
                    tempCells = cells.filter((c) => {
                        if (c.isNode()) {
                            return allChildren.includes(c.id);
                        }
                        return c;
                    });
                    addCells();
                    tempCells.forEach((c) => {
                        c.removeTools();
                        if (c.isNode()) {
                            const currentPosition = c.position();
                            c.position(currentPosition.x + 20, currentPosition.y + 20);
                            resetCell(c);
                        }
                    });
                    setTimeout(() => {
                        tempCells.forEach((n) => {
                            n.toFront();
                        });
                    });
                } else {
                    const selectedCells = this.filterMindCell(this.graph.getSelectedCells())
                        .filter(c => c.isNode());
                    if (selectedCells.length > 0) {
                        const lastSelected = selectedCells.slice(-1)[0];
                        const layout = lastSelected.prop('layout');
                        const checkIsRoot = (node) => {
                            return !tempCells.filter(c => c.isNode()).some(c => (c.prop('children') || []).includes(node.id));
                        };
                        const newChildren = tempCells.filter((c) => {
                            if (c.isNode()) {
                                return checkIsRoot(c);
                            }
                            return false;
                        });
                        addCells();
                        const preChildren = this.id2Nodes(lastSelected.prop('children') || []);
                        lastSelected.setChildren(preChildren.concat(newChildren), {needUndo: true});
                        newChildren.forEach((c) => {
                            this.graph.addEdge({
                                id: Math.uuid(),
                                shape: 'mind-edge',
                                source: {
                                    cell: lastSelected.id,
                                },
                                target: {
                                    cell: c.id,
                                },
                            });
                        });
                        tempCells.forEach((c) => {
                            c.removeTools();
                            if (c.isNode()) {
                                c.prop('layout', layout);
                                resetCell(c);
                            }
                        });
                        this.updateLayout(lastSelected, layout);
                    } else {
                        Message.warring({title: FormatMessage.string({id: 'canvas.node.pasteWarring'})});
                    }
                }
            });
        }
    }
    nodeMove = (node) => {
        if(this.filterMindCell(node)) {
            if(node.shape === 'mind-topic') {
                const children = getChildrenId(node, this.graph.getNodes());
                const edges = this.filterMindCell(this.graph.getEdges());
                edges.forEach((e) => {
                    if (children.includes(e.target.cell) || children.includes(e.source.cell)) {
                        e.toFront();
                    }
                });
            }
            node.toFront({deep: true});
        }
    }
}
