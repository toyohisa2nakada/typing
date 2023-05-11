
// keygraph.js で作成する keygraph の build 後に作成される
// キーチェインをチェックするための関数群
//
keygraph_debug = {
    // ルートを列挙する(データが膨大だと処理が重く止まらない)
    enum_routes: function (keygraph, verbose = true) {
        const log = verbose ? console.log : () => { };
        log("[[keygraph_debug]]: ルート列挙");
        let n_route = 0;
        const sequence = []
        const backuped_sequences = []
        const loop_children = ch => {
            ch._children?.forEach(child => {
                sequence.push(child._key);
                if(child._children===undefined){
                    n_route += 1;
                    backuped_sequences.push(sequence.join());
                    log(n_route,backuped_sequences.slice(-1)[0]);
                }else{
                    loop_children(child);
                }
                sequence.pop();
                // if (child === keygraph._chain_foot) {
                //     n_route += 1;
                //     log(n_route, sequence.join())
                //     backuped_sequences.push(sequence.join())
                // } else {
                //     sequence.push(child._key)
                //     loop_children(child);
                //     sequence.pop();
                // }
            })
        }
        loop_children(keygraph._chain_head);
        if (backuped_sequences.length == Array.from(new Set(backuped_sequences)).length) {
            log("ルート重複なし");
        } else {
            log("ルートに重複あり")
            backuped_sequences.forEach((e, i) => {
                if (backuped_sequences.indexOf(e, i + 1) != -1) {
                    log(e)
                }
            })
        }
        return n_route;
    },

    // 親マージが完全にできているかどうかチェック
    check_merge_parents: function (keygraph) {
        console.log("[[keygraph_debug]]: 親マージの完全性チェック (マージできるノードがある場合、表示される)")

        keygraph._chains.filter(node => node._merged === undefined).forEach(child => {
            const children_equals = (p0, p1) => {
                const to_string = p => p._children.map(e => e._node_id).sort().join(" ");
                return to_string(p0) == to_string(p1);
            }
            const merge_targers =
                child._parents?.
                    map((parent, i) => [parent, i, []]).
                    filter(([parent1, i, replaced]) => {
                        // ノードが表すキーと子ノード一覧が同じノードを取得する。
                        replaced.push(
                            child._parents.find(parent0 =>
                                parent0._key === parent1._key && children_equals(parent0, parent1)
                            ));
                        // 取得した親ノードが検索しているノードと違う場合はマージ対象となる。
                        return replaced[0] !== parent1;
                    })
            merge_targers?.forEach(e => {
                console.log(`マージできるノード id:${e[0]._node_id} key:${e[0]._key} (child id:${child._node_id} key:${child._key})`)
            })
        });
    },

    // 子ノードの重複チェック
    check_children_dup: function (keygraph) {
        console.log("[[keygraph_debug]]: 子ノード一覧に重複したキーが入っていないかチェックする(エラーがある場合だけ表示される)")
        keygraph._chains.forEach(e => {
            if (e._children !== undefined && JSON.stringify(e._children?.map(e => e._key)) !== JSON.stringify(Array.from(new Set(e._children?.map(e => e._key))))) {
                console.log(`id:${e._node_id} key:${e._key} seq_ptr:${e._seq_ptr} char:${e._seq_ptr !== undefined ? keygraph._seq.substring(e._seq_ptr) : ""} の子ノードに重複したノードが入っています。`, e._children)
            }
        })
    },

    // 子一覧、親一覧に _merged が true にセットされたノードが無いか、
    //　また、親子データの整合性があるかチェックする。
    check_merged_and_consistency_parents_childs: function (keygraph) {
        console.log("[[keygraph_debug]]: _mergedがキーグラフに含まれていないか、親子のデータは整合しているか(エラーの箇所だけ表示される)")
        keygraph._chains.filter(node => node._merged === undefined).forEach(node => {
            // 子供一覧を取得する
            node._children?.forEach(child => {
                if (child._merged === true) {
                    console.log(`node id:${node._node_id} key:${node._key} の子一覧に _merged の子ノード id:${child._node_id} が含まれている。`)
                }
                // 子供一覧にこの親が含まれていない場合は、エラーとする。
                if (child._parents.indexOf(node) === -1) {
                    console.log(`node id:${node._node_id} key:${node._key} の子一覧に node id:${child._node_id} key:${child._key} が含まれているけど、その親にこのノード(${node._node_id})がない`)
                }
            });
            // 親一覧を取得する。
            node._parents?.forEach(parent => {
                if (parent._merged === true) {
                    console.log(`node id:${node._node_id} key:${node._key} の親一覧に _merged の子ノード id:${parent._node_id} が含まれている。`)
                }
                if (parent._children.indexOf(node) === -1) {
                    console.log(`node id:${node._node_id} key:${node._key} の親一覧に node id:${parent._node_id} key:${parent._key} が含まれているけど、その子にこのノード(${node._node_id})がない`)
                }
            })
        })
    },
}
