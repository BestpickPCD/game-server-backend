import { Request, Response } from 'express';
import { AgentVendor, PrismaClient, Vendors } from "../../config/prisma/generated/base-default/index.js";
import { RequestWithUser } from "../../models/customInterfaces.ts";
import { BAD_REQUEST } from '../../core/error.response.ts';
import { CREATED, DELETED, OK, UPDATED } from '../../core/success.response.ts';
import { message } from '../../utilities/constants/index.ts';
import { getLogo } from './utilities.ts';

const prisma = new PrismaClient()

export const getVendors = async (
    req: RequestWithUser,
    res: Response
): Promise<any> => {
    
    const vendors = await prisma.vendors.findMany({
        select: {
            id: true,
            name: true,
            url: true,
            fetchGames: true,
            agents: {
                select: {
                    vendorId: true
                },
                where: {
                    agentId: `${req.query.agentId}` ?? req.user?.id
                }
            }
        },
        where: {
            deletedAt: null
        }
    });

    const rearrangedVendors = vendors.map((vendor) => {
        const canSee = vendor.agents.length === 1 ? true : false; // Check if there agent is linked to vendor 
        const { fetchGames, agents, ...data } = {
            ...vendor,
            img: getLogo(req.headers.host, vendor.name),
            gamesTotal: (vendor.fetchGames as [])?.length ?? 0,
            canSee
        };
        return data;
    });

    return new OK({ data:rearrangedVendors }).send(res);
};

export const getVendorList = async (req:Request, res: Response) => {
    try { 
        const { vendorId } = req.query;
        const filter = typeof vendorId === 'string' ? { id: parseInt(vendorId) } : {};

        const vendors = await prisma.vendors.findMany({
            where: filter
        }) as Vendors[];
        const vendorList = vendors.map((vendor) => {
            const img = getLogo(req.headers.host, vendor.name);
            const { createdAt, updatedAt, deletedAt, startDate, endDate, keys, ...returnVendor } =  vendor
            return { ...returnVendor, ...{img: img} } 
        });

        return new OK({ data: vendorList }).send(res);

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const addVendor = async (req:Request, res:Response) => {

    const { name, url, keys } = req.body;

    await prisma.vendors.create({
        data: {
            name, url, keys
        }
    })

    return new CREATED({ data: message.CREATED }).send(res);
}

export const updateVendor = async (req:Request, res:Response) => {

    const { vendorId } = req.params;
    const { name, keys, url } = req.body;
    await prisma.vendors.update({
        where: {
            id: parseInt(vendorId)
        },
        data: {
            name, url, keys
        }
    });

    return new UPDATED({ data: message.UPDATED }).send(res);

}

export const addVendorAgent = async (req:Request, res:Response) => {

    const { agentId, selectedVendors }: { agentId: string, selectedVendors: Vendors[] } = req.body;

    const existingVendors = await prisma.agentVendor.findMany({
        select: { vendorId: true },
        where: { agentId }
    }) as AgentVendor[]

    const existingIds = existingVendors.map(obj => obj.vendorId);
    const selectedIds = selectedVendors.map(obj => obj.id);
    const add = selectedIds.filter(id => !existingIds.includes(id));
    const remove = existingIds.filter(id => !selectedIds.includes(id));

    const toAdd = add.map((vendor) => {
        return {
            agentId,
            vendorId: vendor
        }
    });
    if( add.length > 0) {
        await prisma.agentVendor.createMany({data:toAdd})
    }
    if( remove.length > 0) {
        await prisma.agentVendor.deleteMany({
            where: {
                agentId,
                vendorId:{
                    in: remove ?? []
                }
            }
        })
    }

    return new OK({message: message.SUCCESS}).send(res);

}

export const removeVendorAgent = async (req:Request, res:Response) => {
    
    const { id } = req.params;
    const { vendorId, agentId } = req.body;

    await prisma.agentVendor.delete({
        where: {
            id: parseInt(id),
            agentId,
            vendorId
        }
    });

    return new DELETED({ message: message.DELETED }).send(res);

}

export const updateVendorAgent = async (req:Request, res:Response) => {
    const { id } = req.params;
    const { directUrl } = req.body;
    await prisma.agentVendor.update({
        where: {
            id: parseInt(id)
        },
        data: {
            directUrl
        }
    });

    return new UPDATED({ message: message.UPDATED }).send(res);
}