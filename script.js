// Tu enlace de Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxU0pc02RSG7EJE4Q-P7_RNaPuurSHvhoNhPtfU8tVv9GjCnqheLm4dExl9amd3pPjL/exec";

const orderForm = document.getElementById('orderForm');
const activeOrders = document.getElementById('activeOrders');
const completedOrders = document.getElementById('completedOrders');
const submitBtn = document.getElementById('submitBtn');

document.addEventListener('DOMContentLoaded', fetchOrders);

function cleanDate(dateStr) {
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
    }
    return dateStr;
}

function fetchOrders() {
    activeOrders.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';
    completedOrders.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';
    
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(orders => displayOrders(orders))
        .catch(err => {
            console.error("Error al cargar pedidos:", err);
            activeOrders.innerHTML = '<tr><td colspan="8" style="color:red;">Error de conexión.</td></tr>';
        });
}

// Convertir archivo de imagen a formato Base64 para enviarlo a Google Drive
function fileToBase64(file) {
    return new Promise((resolve) => {
        if (!file) resolve({ raw: "", name: "", type: "" });
        const reader = new FileReader();
        reader.onload = () => resolve({
            raw: reader.result.split(',')[1],
            name: file.name,
            type: file.type
        });
        reader.readAsDataURL(file);
    });
}

// Registrar nuevo pedido con imágenes
orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Subiendo datos e imágenes...";

    const clientVal = document.getElementById('client').value.trim().toUpperCase();
    const fabricVal = document.getElementById('fabric').value;
    const modelVal = document.getElementById('model').value.trim().toUpperCase();
    const sellerVal = document.getElementById('seller').value;
    
    const file1 = document.getElementById('imageFile1').files[0];
    const file2 = document.getElementById('imageFile2').files[0];

    const imgData1 = await fileToBase64(file1);
    const imgData2 = await fileToBase64(file2);

    const payload = {
        action: "add",
        client: clientVal,
        fabric: fabricVal,
        model: modelVal,
        seller: sellerVal,
        status: 'Pendiente',
        imageRaw1: imgData1.raw,
        imageName1: imgData1.name,
        mimeType1: imgData1.type,
        imageRaw2: imgData2.raw,
        imageName2: imgData2.name,
        mimeType2: imgData2.type
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).then(() => {
        orderForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerText = "Guardar Pedido";
        setTimeout(fetchOrders, 2500);
    }).catch(err => {
        console.error("Error al guardar pedido:", err);
        alert("Error al guardar el pedido");
        submitBtn.disabled = false;
        submitBtn.innerText = "Guardar Pedido";
    });
});

// Actualizar estado del pedido (Pendiente, En Proceso, Finalizado)
function updateStatus(client, model, newStatus) {
    const payload = {
        action: "updateStatus",
        client: client,
        model: model,
        status: newStatus
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).then(() => {
        setTimeout(fetchOrders, 1000);
    });
}

// Eliminar pedido
function deleteOrder(client, model) {
    if (confirm(`¿Estás seguro de eliminar el pedido de ${client} (${model})?`)) {
        const payload = {
            action: "delete",
            client: client,
            model: model
        };

        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(() => {
            setTimeout(fetchOrders, 1000);
        });
    }
}

// Mostrar los pedidos en las tablas correspondiente
function displayOrders(orders) {
    activeOrders.innerHTML = '';
    completedOrders.innerHTML = '';

    const reversedOrders = [...orders].reverse();

    const activeList = reversedOrders.filter(o => o.status !== 'Finalizado');
    const completedList = reversedOrders.filter(o => o.status === 'Finalizado');

    // Generar botones para ver Foto 1 y Foto 2
    const getPhotoButtons = (o) => {
        let btns = '';
        if (o.imageUrl1 && o.imageUrl1.startsWith("http")) {
            btns += `<a href="${o.imageUrl1}" target="_blank" style="text-decoration:none; background:#007bff; color:white; padding:4px 6px; border-radius:4px; font-size:11px; margin-right:2px;">🔍 Foto 1</a>`;
        }
        if (o.imageUrl2 && o.imageUrl2.startsWith("http")) {
            btns += `<a href="${o.imageUrl2}" target="_blank" style="text-decoration:none; background:#17a2b8; color:white; padding:4px 6px; border-radius:4px; font-size:11px;">🔍 Foto 2</a>`;
        }
        return btns || `<span style="color:#888;">Sin fotos</span>`;
    };

    // Renderizar Trabajos Activos
    if (activeList.length === 0) {
        activeOrders.innerHTML = '<tr><td colspan="8">No hay trabajos activos.</td></tr>';
    } else {
        activeList.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cleanDate(order.date)}</td>
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
                <td>${getPhotoButtons(order)}</td>
                <td><button onclick="fetchOrders()">🔄 Sincronizar</button></td>
            `;
            activeOrders.appendChild(row);
        });
    }

    // Renderizar Trabajos Finalizados
    if (completedList.length === 0) {
        completedOrders.innerHTML = '<tr><td colspan="8">No hay trabajos finalizados.</td></tr>';
    } else {
        completedList.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'completed-order-row';
            row.innerHTML = `
                <td>${cleanDate(order.date)}</td>
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
                <td>${getPhotoButtons(order)}</td>
                <td>
                    <button style="background-color: #dc3545; color: white;" onclick="deleteOrder('${order.client}', '${order.model}')">🗑️ Eliminar</button>
                </td>
            `;
            completedOrders.appendChild(row);
        });
    }
}
