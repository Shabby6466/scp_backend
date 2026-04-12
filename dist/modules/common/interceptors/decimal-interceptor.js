"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let DecimalInterceptor = class DecimalInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => {
            return this.transform(data);
        }));
    }
    transform(data) {
        if (Array.isArray(data)) {
            return data.map((item) => this.transform(item));
        }
        if (data !== null && typeof data === 'object') {
            const transformed = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const value = data[key];
                    if (typeof value === 'number' && !Number.isInteger(value)) {
                        transformed[key] = parseFloat(value.toFixed(2));
                    }
                    else {
                        transformed[key] = this.transform(value);
                    }
                }
            }
            return transformed;
        }
        return data;
    }
};
exports.DecimalInterceptor = DecimalInterceptor;
exports.DecimalInterceptor = DecimalInterceptor = __decorate([
    (0, common_1.Injectable)()
], DecimalInterceptor);
//# sourceMappingURL=decimal-interceptor.js.map