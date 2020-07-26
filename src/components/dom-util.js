class DomUtil{
    constructor() {}

    getNodeIndex(node, ignoreTextNode) {
        var preNode = node, i = 0;

        while ((preNode = preNode.previousSibling)) {
            if (ignoreTextNode && preNode.nodeType == 3) {
                if (preNode.nodeType != preNode.nextSibling.nodeType) {
                    i++;
                }
                continue;
            }
            i++;
        }
        return i;
    }
}

export { DomUtil };
