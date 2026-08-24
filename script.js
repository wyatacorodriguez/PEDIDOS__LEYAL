const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxU0pc02RSG7EJE4Q-P7_RNaPuurSHvhoNhPtfU8tVv9GjCnqheLm4dExl9amd3pPjL/exec";

const orderForm = document.getElementById('orderForm');
const activeOrders = document.getElementById('activeOrders');
const completedOrders = document.getElementById('completedOrders');

document.addEventListener('DOMContentLoaded', fetchOrders);

function fetchOrders() {
    activeOrders.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
    completedOrders.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
    
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(orders => displayOrders(orders))
        .catch(err => {
            console.error("Error al cargar pedidos:", err);
            activeOrders.innerHTML = '<tr><td colspan="7" style="color:red;">Error de conexión.</td></tr>';
        });
}

orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const clientVal = document.getElementById('client').value.trim().toUpperCase();
    const fabricVal = document.getElementById('fabric').value;
    const modelVal = document.getElementById('model').value.trim().toUpperCase();
    const sellerVal = document.getElementById('seller').value;

    const newOrder = {
        action: "add",
        client: clientVal,
        fabric: fabricVal,
        model: modelVal,
        seller: sellerVal,
        status: 'Pendiente'
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(newOrder)
    }).then(() => {
        orderForm.reset();
        setTimeout(fetchOrders, 1500);
    });
});

function updateStatus(client, model, newStatus) {
    const payload = {
        action: "updateStatus",
        client: client,
        model: model,
        status: newStatus
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
    }).then(() => {
        setTimeout(fetchOrders, 1000);
    });
}

function deleteOrder(client, model) {
    if (confirm(`¿Estás seguro de eliminar el pedido de ${client} (${model})?`)) {
        const payload = {
            action: "delete",
            client: client,
            model: model
        };

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        }).then(() => {
            setTimeout(fetchOrders, 1000);
        });
    }
}

function displayOrders(orders) {
    activeOrders.innerHTML = '';
    completedOrders.innerHTML = '';

    // Invertimos la lista con .reverse() para que el último pedido grabado salga arriba
    const reversedOrders = [...orders].reverse();

    const activeList = reversedOrders.filter(o => o.status !== 'Finalizado');
    const completedList = reversedOrders.filter(o => o.status === 'Finalizado');

    if (activeList.length === 0) {
        activeOrders.innerHTML = '<tr><td colspan="7">No hay trabajos activos.</td></tr>';
    } else {
        activeList.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.date || ''}</td>
                <td><strong>${order.client}</strong></td>
                <td>${order.fabric}</td>
                <td>${order.model}</td>
                <td>${order.seller}</td>
                <td>
                    <select onchange="updateStatus('${order.client}', '${order.model}', this.value)">
                        <option value="Pendiente" ${order.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En Proceso" ${order.status === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Finalizado">Finalizado</option>
                    </select>
                </td>
                <td><button onclick="fetchOrders()">🔄 Sincronizar</button></td>
            `;
            activeOrders.appendChild(row);
        });
    }

    if (completedList.length === 0) {
        completedOrders.innerHTML = '<tr><td colspan="7">No hay trabajos finalizados.</td></tr>';
    } else {
        completedList.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'completed-order-row';
            row.innerHTML = `
                <td>${order.date || ''}</td>
                <td><strong>${order.client}</strong></td>
                <td>${order.fabric}</td>
                <td>${order.model}</td>
                <td>${order.seller}</td>
                <td>
                    <select onchange="updateStatus('${order.client}', '${order.model}', this.value)">
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Finalizado" selected>Finalizado</option>
                    </select>
                </td>
                <td>
                    <button style="background-color: #dc3545; color: white;" onclick="deleteOrder('${order.client}', '${order.model}')">🗑️ Eliminar</button>
                </td>
            `;
            completedOrders.appendChild(row);
        });
    }
}
