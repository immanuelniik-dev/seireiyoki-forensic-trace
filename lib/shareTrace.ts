export const shareTrace = (batchId: string, url: string) => {
    if (navigator.share) {
        navigator.share({
            title: `Seirei Forensic Trace: ${batchId}`,
            text: `Track your consignment ${batchId} live with Seirei Yoki.`, 
            url: url,
        })
        .then(() => console.log('Share successful'))
        .catch((error) => console.error('Sharing failed', error));
    } else {
        // Fallback for browsers that do not support the Web Share API
        navigator.clipboard.writeText(url).then(() => {
            alert(`Trace link copied to clipboard: ${url}`);
        }).catch((error) => {
            console.error('Failed to copy URL to clipboard', error);
        });
    }
};