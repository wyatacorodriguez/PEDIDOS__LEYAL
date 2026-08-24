function displayOrders(orders) {
    activeOrders.innerHTML = '';
    completedOrders.innerHTML = '';

    const activeList = orders.filter(o => o.status !== 'Finalizado');
    const completedList = orders.filter(o => o.status === 'Finalizado');

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
