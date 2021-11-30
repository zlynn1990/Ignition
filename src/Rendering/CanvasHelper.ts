import { CanvasHeight, CanvasWidth, TwoPi } from "../Constants";
import { Point } from "../Primitives/Point";

export function fill(context: CanvasRenderingContext2D, color: string) {
    context.globalAlpha = 1.0;
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = color;
    context.fillRect(0, 0, CanvasWidth, CanvasHeight);
}

export function drawCircle(context: CanvasRenderingContext2D, position: Point, radius: number, color: string) {
    context.beginPath();
    context.arc(position.x, position.y, radius, 0, TwoPi, false);
    context.fillStyle = color;
    context.fill();
}

export function drawLine(context: CanvasRenderingContext2D, start: Point, end: Point, color: string) {
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.moveTo(end.x, end.y);
    context.fillStyle = color;
    context.fill();
}

export function drawRectangle(context: CanvasRenderingContext2D, topLeft: Point, bottomRight: Point, color: string) {
    context.beginPath();
    context.moveTo(topLeft.x, topLeft.y);
    context.lineTo(topLeft.x, bottomRight.y);
    context.lineTo(bottomRight.x, bottomRight.y);
    context.lineTo(bottomRight.x, topLeft.y);
    context.fillStyle = color;
    context.fill();
}

export function drawText(context: CanvasRenderingContext2D, position: Point, text: string, color: string) {
    context.font = "20px Georgia";
    context.fillStyle = color;
    context.fillText(text, position.x, position.y);
}

export function overlayImage(context: CanvasRenderingContext2D, image: HTMLImageElement) {
    context.globalCompositeOperation = 'overlay';
    context.drawImage(image, 0, 0);
    context.globalCompositeOperation = 'source-over';
}

export function drawImage(context: CanvasRenderingContext2D, image: HTMLImageElement) {
    context.globalCompositeOperation = 'overlay';
    context.drawImage(image, 0, 0);
    context.globalCompositeOperation = 'source-over';
}