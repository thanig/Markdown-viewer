import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidBlockProps {
    chart: string;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize mermaid only once when component mounts or chart changes
        // Safe to call multiple times as it just redundant
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            securityLevel: 'loose',
            themeVariables: {
                primaryColor: '#EBE6FF', // Lavender for nodes
                primaryTextColor: '#000000',
                primaryBorderColor: '#9966FF',
                lineColor: '#000000',
                tertiaryColor: '#FFFFED', // Light yellow for clusters
                tertiaryBorderColor: '#CCCC99',
                noteBkgColor: '#FFFFED',
                noteTextColor: '#000000',
                fontFamily: 'arial',
            },
        });

        const renderChart = async () => {
            if (!chart) return;

            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg: renderedSvg } = await mermaid.render(id, chart);
                setSvg(renderedSvg);
                setError(null);
            } catch (err) {
                console.error('Mermaid rendering error:', err);
                setError('Failed to render flow chart');
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return <div className="mermaid-error">{error}</div>;
    }

    return (
        <div
            className="mermaid-chart"
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};
