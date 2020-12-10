import { Arr, Fun, Obj, Optional, Result, Type } from '@ephox/katamari';
import { SugarElement } from '@ephox/sugar';
import { SimpleGenerators } from '../api/Generators';
import * as Structs from '../api/Structs';
import * as TableLookup from '../api/TableLookup';
import { Warehouse } from '../api/Warehouse';
import * as MergingOperations from '../operate/MergingOperations';
import * as ColUtils from '../util/ColUtils';
import * as Fitment from './Fitment';
import * as GridRow from './GridRow';

// This mainly to protect against atomic tests
const isSugarElement = (elm: any): elm is SugarElement => Type.isObject(elm) && Obj.hasNonNullableKey(elm, 'dom');

const getLockedColumns = (grid: Structs.RowCells[]): number[] => {
  return Optional.from(grid[0].cells[0].element)
    .filter(isSugarElement)
    .bind(TableLookup.table)
    .map((table) => {
      const warehouse = Warehouse.fromTable(table);
      const lockedColumns = Warehouse.filterItems(warehouse, (detail) => detail.isLocked);
      const uniqueCols = ColUtils.uniqueColumns(lockedColumns);
      return Arr.map(uniqueCols, (col) => col.column);
    }).getOr([]);
};

// const getLockedColumns = (grid: Structs.RowCells[]): Record<number, boolean> => {
//   return Optional.from(grid[0].cells[0].element)
//     .filter(isSugarElement)
//     .bind(TableLookup.table)
//     .map((table) => {
//       const warehouse = Warehouse.fromTable(table);
//       const { pass: locked, fail: unlocked } = Arr.partition(ColUtils.uniqueColumns(Warehouse.justCells(warehouse)), (detail) => detail.isLocked);
//       const lockedCols = Arr.map(locked, (detail) => detail.column);
//       const unlockedCols = Arr.map(unlocked, (detail) => detail.column);
//       return {
//         ...Arr.mapToObject(lockedCols, Fun.always),
//         ...Arr.mapToObject(unlockedCols, Fun.never)
//       };
//     }).getOr({});
// };

const isSpanning = (grid: Structs.RowCells[], row: number, col: number, comparator: (a: SugarElement, b: SugarElement) => boolean): boolean => {
  const candidate = GridRow.getCell(grid[row], col);
  const matching = Fun.curry(comparator, candidate.element);
  const currentRow = grid[row];

  // sanity check, 1x1 has no spans
  return grid.length > 1 && GridRow.cellLength(currentRow) > 1 &&
    (
      // search left, if we're not on the left edge
      // search down, if we're not on the bottom edge
      (col > 0 && matching(GridRow.getCellElement(currentRow, col - 1))) ||
      // search right, if we're not on the right edge
      (col < currentRow.cells.length - 1 && matching(GridRow.getCellElement(currentRow, col + 1))) ||
      // search up, if we're not on the top edge
      (row > 0 && matching(GridRow.getCellElement(grid[row - 1], col))) ||
      (row < grid.length - 1 && matching(GridRow.getCellElement(grid[row + 1], col)))
    );
};

const mergeTables = (startAddress: Structs.Address, gridA: Structs.RowCells[], gridB: Structs.RowCells[], generator: SimpleGenerators, comparator: (a: SugarElement, b: SugarElement) => boolean, lockedColumns: number[]): Structs.RowCells[] => {
  // Assumes
  //  - gridA is square and gridB is square
  const startRow = startAddress.row;
  const startCol = startAddress.column;
  const mergeHeight = gridB.length;
  const mergeWidth = GridRow.cellLength(gridB[0]);
  const endRow = startRow + mergeHeight;
  const endCol = startCol + mergeWidth + lockedColumns.length;
  let skipped = 0;
  // embrace the mutation - I think this is easier to follow? To discuss.
  for (let r = startRow; r < endRow; r++) {
    skipped = 0;
    for (let c = startCol; c < endCol; c++) {
      if (Arr.exists(lockedColumns, (colNum) => colNum === c)) {
        skipped++;
        continue;
      }

      // const

      // TODO: Does the c used below need to subtract skipped as well?
      if (isSpanning(gridA, r, c - skipped, comparator)) {
        // mutation within mutation, it's mutatception
        MergingOperations.unmerge(gridA, GridRow.getCellElement(gridA[r], c - skipped), comparator, generator.cell);
      }
      const newCell = GridRow.getCellElement(gridB[r - startRow], c - startCol - skipped);
      const replacement = generator.replace(newCell);
      GridRow.mutateCell(gridA[r], c, Structs.elementnew(replacement, true));
    }
  }
  return gridA;
};

const getValidStartAddress = (currentStartAddress: Structs.Address, grid: Structs.RowCells[], lockedColumns: number[]): Structs.Address => {
  const gridColLength = GridRow.cellLength(grid[0]);
  const possibleColAddresses = Arr.range(gridColLength - currentStartAddress.column, (num) => num + currentStartAddress.column);
  const validColAdress = Arr.find(possibleColAddresses, (num) => Arr.forall(lockedColumns, (col) => col !== num)).getOr(gridColLength - 1);
  return {
    ...currentStartAddress,
    column: validColAdress
  };
};

const merge = (startAddress: Structs.Address, gridA: Structs.RowCells[], gridB: Structs.RowCells[], generator: SimpleGenerators, comparator: (a: SugarElement, b: SugarElement) => boolean): Result<Structs.RowCells[], string> => {
  const lockedColumns = getLockedColumns(gridA);
  const validStartAddress = getValidStartAddress(startAddress, gridA, lockedColumns);
  const lockedColumnsWithinBounds = Arr.filter(lockedColumns, (colNum) => colNum >= validStartAddress.column && colNum <= GridRow.cellLength(gridB[0]) + validStartAddress.column);

  const result = Fitment.measure(validStartAddress, gridA, gridB);
  // Need to subtract extra delta for locked columns between startAddress and the startAdress + gridB column count as
  // locked column cells cannot be merged into. Therefore, extra column cells need to be added to gridA to allow gridB cells to merge in
  return result.map((diff) => {
    const delta: Fitment.Delta = {
      ...diff,
      colDelta: diff.colDelta - lockedColumnsWithinBounds.length
    };

    const fittedGrid = Fitment.tailor(gridA, delta, generator);
    return mergeTables(validStartAddress, fittedGrid, gridB, generator, comparator, lockedColumnsWithinBounds);
  });
};

const insertCols = (index: number, gridA: Structs.RowCells[], gridB: Structs.RowCells[], generator: SimpleGenerators, comparator: (a: SugarElement, b: SugarElement) => boolean): Structs.RowCells[] => {
  MergingOperations.splitCols(gridA, index, comparator, generator.cell);

  const delta = Fitment.measureHeight(gridB, gridA);
  const fittedNewGrid = Fitment.tailor(gridB, delta, generator);

  const secondDelta = Fitment.measureHeight(gridA, fittedNewGrid);
  const fittedOldGrid = Fitment.tailor(gridA, secondDelta, generator);

  return Arr.map(fittedOldGrid, (gridRow, i) => {
    const newCells = gridRow.cells.slice(0, index).concat(fittedNewGrid[i].cells).concat(gridRow.cells.slice(index, gridRow.cells.length));
    return GridRow.setCells(gridRow, newCells);
  });
};

const insertRows = (index: number, gridA: Structs.RowCells[], gridB: Structs.RowCells[], generator: SimpleGenerators, comparator: (a: SugarElement, b: SugarElement) => boolean): Structs.RowCells[] => {
  MergingOperations.splitRows(gridA, index, comparator, generator.cell);

  const locked = getLockedColumns(gridA);
  const diff = Fitment.measureWidth(gridB, gridA);
  // Don't want the locked columns to count towards to the colDelta as column filling for locked columns is handled separately
  const delta: Fitment.Delta = {
    ...diff,
    colDelta: diff.colDelta + locked.length
  };
  const fittedNewGrid = Fitment.tailor(gridB, delta, generator, locked);

  // Don't need to worry about locked columns in this pass,
  // as gridB (pasted row) has already been adjusted to include cells for the locked columns and should match gridA column count
  const secondDelta = Fitment.measureWidth(gridA, fittedNewGrid);
  const fittedOldGrid = Fitment.tailor(gridA, secondDelta, generator);
  const { cols: oldCols, rows: oldRows } = GridRow.extractGridDetails(fittedOldGrid);

  return oldCols.concat(oldRows.slice(0, index)).concat(fittedNewGrid).concat(oldRows.slice(index, oldRows.length));
};

export {
  merge,
  insertCols,
  insertRows
};
