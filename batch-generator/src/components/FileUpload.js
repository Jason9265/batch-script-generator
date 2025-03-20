'use client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FileUpload({ onFileChange }) {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel')) {
            onFileChange(file);
        } else {
            alert('请上传有效的CSV或Excel文件');
        }
    };

    return (
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Input 
                id="file" 
                type="file" 
                accept=".csv,.xls"
                onChange={handleFileChange}
                className="cursor-pointer"
            />
            <Label htmlFor="file" className="text-sm text-muted-foreground">
                支持 CSV 和 Excel 格式
            </Label>
        </div>
    );
} 
