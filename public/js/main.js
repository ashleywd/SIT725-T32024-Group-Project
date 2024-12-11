// public/js/main.js
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems);
    
    const postForm = document.getElementById('postForm');

    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            userId: document.getElementById('userId').value,
            type: document.getElementById('type').value,
            hoursNeeded: parseFloat(document.getElementById('hoursNeeded').value),
            description: document.getElementById('description').value,
            dateTime: document.getElementById('dateTime').value
        };

        // Log the data being sent
        console.log('Sending form data:', formData);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(`Server error: ${result.error || 'Unknown error'}`);
            }

            console.log('Server response:', result);
            M.toast({html: 'Post created successfully!'});
            postForm.reset();
            
            // Reinitialize select after form reset
            var instances = M.FormSelect.init(elems);
            
        } catch (error) {
            console.error('Detailed error:', error);
            M.toast({
                html: `Error: ${error.message}`,
                classes: 'red'
            });
        }
    });
});