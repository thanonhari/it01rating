// ==========================================================
// == ✨ กรุณาแก้ไขค่า 2 บรรทัดนี้ ✨ ==
// ==========================================================
const LIFF_ID = "2007495650-QYp0MBBk"; // LIFF ID ของหน้าประเมินที่คุณสร้างใหม่
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby02fO2_GgLEWJif2dYzF9wKK1f9SDiRxXGPuCshwIdwx-e4MZj2227RZ8-fSJCZm46GQ/exec"; // URL ของ Web App ที่ได้จากการ Deploy
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {
    const loadingDiv = document.getElementById('loading');
    const formDiv = document.getElementById('evaluationForm');
    const thankYouDiv = document.getElementById('thankYouMessage');

    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isInClient()) {
            loadingDiv.innerHTML = '<p class="text-red-500 font-bold text-center">กรุณาเปิดหน้านี้ผ่านแอปพลิเคชัน LINE</p>';
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const ticketId = urlParams.get('ticketId');
        if (!ticketId) throw new Error("ไม่พบรหัสใบแจ้งซ่อม");

        // เรียก API จาก Google Apps Script เพื่อดึงข้อมูลและสถานะการประเมิน
        const response = await fetch(`${SCRIPT_URL}?action=getEvaluationData&ticketId=${ticketId}`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // ตรวจสอบว่าเคยประเมินแล้วหรือไม่
        if (data.alreadyEvaluated) {
            loadingDiv.classList.add('hidden');
            thankYouDiv.classList.remove('hidden');
        } else {
            populateForm(data.repairData);
            loadingDiv.classList.add('hidden');
            formDiv.classList.remove('hidden');
        }

    } catch (error) {
        console.error("Error:", error);
        loadingDiv.innerHTML = `<p class="text-red-500 font-bold text-center">เกิดข้อผิดพลาด: ${error.message}</p>`;
    }
});

function populateForm(data) {
    if (!data) throw new Error("ไม่พบข้อมูลงานซ่อม");
    document.getElementById('info-ticketId').textContent = data['รหัสใบแจ้งซ่อม'] || 'N/A';
    document.getElementById('info-equipmentName').textContent = data['ชื่อครุภัณฑ์'] || 'N/A';
    document.getElementById('info-operator').textContent = data['ผู้ปฏิบัติงาน'] || 'N/A';
}

document.getElementById('evaluationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    
    // ตรวจสอบว่าผู้ใช้ให้คะแนนดาวแล้วหรือยัง
    const overallScore = this.elements['overall'].value;
    if (!overallScore) {
        Swal.fire('กรุณาให้คะแนน', 'โปรดให้คะแนนความพึงพอใจโดยรวมก่อนส่งแบบประเมิน', 'warning');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังส่ง...';

    const evaluationData = {
        ticketId: new URLSearchParams(window.location.search).get('ticketId'),
        overallScore: parseInt(overallScore),
        comments: this.elements['comments'].value.trim()
    };

    try {
        // ส่งข้อมูลกลับไปที่ Google Apps Script ผ่าน POST request
        const response = await fetch(`${SCRIPT_URL}?action=submitEvaluation`, {
            method: 'POST',
            body: JSON.stringify(evaluationData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // ใช้ text/plain สำหรับ Apps Script
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Unknown error');
        
        document.getElementById('evaluationForm').classList.add('hidden');
        document.getElementById('thankYouMessage').classList.remove('hidden');

    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'ส่งแบบประเมิน';
    }
});
