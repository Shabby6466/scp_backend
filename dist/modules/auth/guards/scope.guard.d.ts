import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Branch } from '../../../entities/branch.entity';
export declare class ScopeGuard implements CanActivate {
    private readonly branchRepository;
    constructor(branchRepository: Repository<Branch>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
