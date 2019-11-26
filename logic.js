/**
 * Cria a compra de itens de acordo com o Carrinho especifico
 * @param {org.acme.model.EfetuaCompra} compra - Transação de criação de compras provenientes do carrinho
 * @transaction
 */
function criarCompra(compra) {
        var carrinho = compra.carrinho;

        if (carrinho.estado === 'CHEIO') {
            throw new Error('O carrinho não pode ter mais itens.');
        }

        
        if (carrinho.estado === 'FINALIZADO') {
            throw new Error('A compra já foi realizada, impossivel adicionar itens.');
        } 

        if (carrinho.compras == null) {
            carrinho.compras = [];
        }

        carrinho.compras.push(compra);
    
        return getAssetRegistry('org.acme.model.Carrinho')
        .then(function(carrinhoRegistry) {
        if (carrinho.compras.length > 10) {
            carrinho.estado = "CHEIO"
        }
            carrinhoRegistry.update(carrinho);
    
        return getAssetRegistry('org.acme.model.Cliente')
        .then(function(clienteRegistry) {
            cliente = carrinho.cliente
            clienteRegistry.update(cliente);
        });
    });
}

/**
* Finaliza a compra, realizando as operações de descontar da carteira do cliente.
* @param {org.acme.model.FinalizarCompra} _carrinho - Transação com a compra que será finalizada.
* @transaction
*/
    function finalizarCompra(_carrinho) {
        var carrinho = _carrinho.carrinho;
        if (carrinho.estado === 'CHEIO') {
            throw new Error('O carrinho está cheio, remova algum item!');
        }
        
        var cliente = carrinho.cliente;
        var valorTotal = 0;
        
        for(var i = 0; i < carrinho.compras.length; i++){
            valorTotal += carrinho.compras[i].quantidade * carrinho.compras[i].produto.valor;
        }

        if (valorTotal > cliente.saldoDisponivel) {
            throw new Error('O cliente não possui saldo suficiente');
        } else {
                return getAssetRegistry('org.acme.model.Carrinho')
                .then(function (carrinhoRegistry) {
                    //Atualiza o estado do Carrinho
                    carrinho.valorTotal = valorTotal;
                    carrinho.estado = 'FINALIZADO';
                    carrinhoRegistry.update(carrinho);

                return getParticipantRegistry('org.acme.model.Cliente')
                .then(function (clienteRegistry) {
                    //Atualiza saldo do cliente debitando o valor da Compra
                    cliente.saldoDisponivel -= carrinho.valorTotal;
                    clienteRegistry.update(cliente);
            });
        });
    }
}